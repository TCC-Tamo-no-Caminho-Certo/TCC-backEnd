import User, { UserCtor, UserFilters } from '../database/models/user/user'
import Email, { EmailCtor } from '../database/models/user/email'
import Role, { RoleTypes } from '../database/models/user/role'
import RoleReq from '../database/models/request/roleReq'
import redis from '../services/redis'
import ArisError from './arisError'
import { v4 as uuidv4 } from 'uuid'
import { Transaction } from 'knex'
import db from '../database'
import argon from 'argon2'

import { Request } from 'express'

export default class ArisUser {
  user: User
  emails: Email[]
  roles: RoleTypes[]

  private txn?: Transaction

  constructor(user: User, emails: Email[], roles: RoleTypes[]) {
    this.user = user
    this.emails = emails
    this.roles = roles
  }

  // -----USER----- //

  static async createUser(
    user_info: Omit<UserCtor, 'user_id' | 'avatar' | 'created_at' | 'updated_at'>,
    email_info: Omit<EmailCtor, 'email_id' | 'main'>
  ) {
    const tnx = await db.transaction()

    user_info.password = await argon.hash(user_info.password)

    const user = new User(user_info)
    await user.insert(tnx)
    const email = new Email({ ...email_info, main: true })
    await email.insert(user.user_id, tnx)
    const role = Role.get('guest')
    await role.linkWithUser(user.user_id, tnx)

    await tnx.commit()

    return new ArisUser(user, [email], ['guest'])
  }

  async updateUser({ name, surname, birthday, password, phone, avatar }: Partial<Omit<UserCtor, 'user_id' | 'created_at' | 'updated_at'>>) {
    if (name) this.user.name = name
    if (surname) this.user.surname = surname
    if (birthday) this.user.birthday = birthday
    if (password) this.user.password = await argon.hash(password)
    if (phone) this.user.phone = phone
    if (avatar) this.user.avatar = avatar

    await this.user.update()
  }

  async deleteUser() {
    await this.user.delete()
  }

  async verifyPassword(password: string) {
    if (!(await argon.verify(this.user.password, password))) throw new ArisError('Incorrect password!', 400)
  }

  /**
   * Checks if an user is already registered, and returns its id if so.
   */
  static async existUser(email: string) {
    const user_id: number | boolean = await User.exist(email)
    return user_id
  }

  /**
   * returns an Aris user.
   * @param identifier - an user id or email.
   */
  static async getUser(identifier: string | number) {
    const user = await User.get(identifier)
    const emails = await Email.getUserEmails(user.user_id)
    const roles = await Role.getUserRoles(user.user_id)

    return new ArisUser(user, emails, roles)
  }

  /**
   * Select (with a filter or not) users.
   */
  static async getAllUsers(filters: UserFilters, page: number) {
    const users: any = await User.getAll(filters, page)
    const ids = users.map((user: any) => user.user_id)
    const emails = await Email.getUsersEmails(ids)
    const roles = await Role.getUsersRoles(ids)

    users.map((user: any) => {
      delete user.password
      user.emails = emails.filter(email => email.user_id === user.user_id).map(email => new Email(email))
      user.roles = roles.filter(role => role.user_id === user.user_id).map(role => role.title)
    })
    return users
  }

  // -----EMAIL----- //

  async addEmail(email_info: Omit<EmailCtor, 'email_id' | 'main'>) {
    const email = new Email(email_info)
    await email.insert(this.user.user_id, this.txn)
    this.emails.push(email)
  }

  async removeEmail(address: string) {
    const email = this.emails.find(email => email.address === address)
    if (!email) throw new ArisError('Email address not vinculated to this user!', 400)
    await email.delete(this.txn)
    this.emails = this.emails.filter(email => email.address !== address)
  }

  // -----ROLE----- //

  /**
   * Adds a role for this user in the database.
   */
  async addRole(identifier: number | RoleTypes) {
    const role = Role.get(identifier)
    await role.linkWithUser(this.user.user_id, this.txn)
    this.roles.push(role.title)
  }

  /**
   * Updates a role for this user in the database.
   */
  async updateRole(prev_role: RoleTypes, new_role: RoleTypes) {
    const n_role = Role.get(new_role)
    const p_role = Role.get(prev_role)

    await db('user_role').update({ role_id: n_role.role_id }).where({ user_id: this.user.user_id, role_id: p_role.role_id })
    this.roles = this.roles.map(role => (role === p_role.title ? n_role.title : role))
  } // MAYBE DELETE THIS

  /**
   * Removes a role for this user in the database.
   */
  async removeRole(identifier: number | RoleTypes) {
    const r_role = Role.get(identifier)
    await r_role.unLinkWithUser(this.user.user_id, this.txn)
    this.roles = this.roles.filter(role => role !== r_role.title)
  }

  // -----REQUESTS----- //

  async requestRole(role: RoleTypes, data: string) {
    if (this.roles.some(user_role => user_role === role)) throw new ArisError('User already have this role!', 400)
    if (await RoleReq.exist(this.user.user_id, role)) throw new ArisError('Request already exists!', 400)

    const { role_id } = Role.get(role)

    const request = new RoleReq({ user_id: this.user.user_id, role_id, data, status: 'awaiting' })
    await request.insert()
  }

  // -----AUTH----- //

  /**
   * Generates an access_token for the user.
   */
  async generateAccessToken(remember?: boolean) {
    const { user_id } = this.user
    const { roles } = this
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
  async updateAccessTokenData() {
    const { user_id } = this.user
    const { roles } = this

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
   * Delets an access_token for the user.
   */
  static async deleteAccessToken(req: Request, delete_auth_data?: boolean) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts

    await redis.client.delAsync(`auth:${token}`)

    if (delete_auth_data) {
      const [user_id] = token.split('-', 1)
      await redis.client.delAsync(`auth:data:${user_id}`)
    }
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
