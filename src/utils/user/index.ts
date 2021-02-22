import User, { UserCtor, UserFilters } from '../../database/models/user/user'
import redis from '../../services/redis'
import ArisError from '../arisError'
import Email from './email'
import Role from './role'

import { v4 as uuidv4 } from 'uuid'
import argon from 'argon2'

import { Transaction } from 'knex'
import db from '../../database'

import { Request } from 'express'

type FormattedUser = Required<Omit<UserCtor, 'password' | 'phone'>> & Pick<UserCtor, 'phone'>

export default class ArisUser extends User {
  private txn?: Transaction

  /**
   * Creates an new user.
   */
  static async create(user_info: Omit<UserCtor, 'user_id' | 'avatar' | 'created_at' | 'updated_at'>) {
    user_info.password = await argon.hash(user_info.password)

    const user = new ArisUser(user_info)
    await user._insert()

    return user
  }

  /**
   * returns a parameter of user.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedUser>(key: T): FormattedUser[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of user infos.
   */
  format() {
    const aux_ob: FormattedUser = {
      user_id: this.user_id,
      name: this.name,
      surname: this.surname,
      full_name: this.full_name,
      phone: this.phone,
      birthday: this.birthday,
      avatar: this.avatar,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
    return aux_ob
  }

  /**
   * Checks if an user is already registered, and returns its id if so.
   */
  static async exist(email_address: string) {
    const [email] = await Email.get({ address: email_address })
    return email.get('main') ? email.get('user_id') : false
  }

  /**
   * Returns an Aris user array.
   */
  static async get<T extends UserFilters>(filter: T, pagination?: Pagination) {
    const users = await this._get(filter, pagination)

    return <T extends { user_id: number } ? [ArisUser] : ArisUser[]>users.map(user => new ArisUser(user))
  }

  /**
   * Updates the user`s information.
   */
  async update({ name, surname, birthday, password, phone, avatar }: Partial<Omit<UserCtor, 'user_id' | 'created_at' | 'updated_at'>>) {
    if (name) this.name = name
    if (surname) this.surname = surname
    if (birthday) this.birthday = birthday
    if (password) this.password = await argon.hash(password)
    if (phone || phone === null) this.phone = phone
    if (avatar) this.avatar = avatar

    await this._update(this.txn)
  }

  /**
   * Deletes an user and everything associated with it.
   */
  async delete() {
    await this._delete(this.txn)
  }

  /**
   * Verify the given password with the user`s hash.
   * @param password -string to be verified with the user`s hash.
   */
  async verifyPassword(password: string) {
    if (!(await argon.verify(this.password, password))) throw new ArisError('Incorrect password!', 400)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Email = Email

  static Role = Role

  // -----AUTH----- //

  /**
   * Generates an access_token for the user.
   */
  static async generateAccessToken(user_id: number, roles: RoleTypes[], remember?: boolean) {
    const token = uuidv4()

    const data = JSON.parse(await redis.client.getAsync(`auth:data:${user_id}`))

    if (!data) {
      await redis.client.setAsync(
        `auth:data:${user_id}`,
        JSON.stringify({
          id: user_id,
          roles
        })
      )
    }
    await redis.client.setexAsync(`auth:${user_id}-${token}`, remember ? 2592000 : 86400, user_id.toString())

    return `${user_id}-${token}`
  }

  /**
   * Updates access_token_data of this user.
   */
  static async updateAccessTokenData(user_id: number, roles: RoleTypes[]) {
    await redis.client.delAsync(`auth:data:${user_id}`)
    await redis.client.setAsync(
      `auth:data:${user_id}`,
      JSON.stringify({
        id: user_id,
        roles
      })
    )
  }

  /**
   * Delets an access token of the user.
   */
  static async deleteAccessToken(req: Request) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts

    await redis.client.delAsync(`auth:${token}`)
  }

  /**
   * Delets all access token of the user.
   */
  static async deleteAllAccessToken(req: Request) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts
    const [user_id] = token.split('-', 1)

    const keys = await redis.client.getAsync(`auth:${user_id}*`)
    await redis.client.delAsync(keys)
  }

  /**
   * Delets an auth data of the user.
   */
  static async deleteAuthData(req: Request) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts
    const [user_id] = token.split('-', 1)

    await redis.client.delAsync(`auth:data:${user_id}`)
  }

  // -----TRANSACTION----- //

  /**
   * creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }
}
