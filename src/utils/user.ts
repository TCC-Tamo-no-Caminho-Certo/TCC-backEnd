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

type FormattedUser = Omit<User, 'password' | 'insert' | 'update' | 'delete'> & {
  emails: Omit<Email, 'insert' | 'update' | 'delete'>[]
  roles: RoleTypes[]
}

export default class ArisUser {
  private user: User
  private emails: Email[]
  private roles: Role[]

  private txn?: Transaction

  constructor(user: User, emails: Email[], roles: Role[]) {
    this.user = user
    this.emails = emails
    this.roles = roles
  }

  /**
   * Creates an new user.
   */
  static async createUser(
    user_info: Omit<UserCtor, 'user_id' | 'avatar' | 'created_at' | 'updated_at'>,
    email_info: Omit<EmailCtor, 'email_id' | 'user_id' | 'main'>
  ) {
    const txn = await db.transaction()

    user_info.password = await argon.hash(user_info.password)

    const user = new User(user_info)
    await user.insert(txn)
    const email = new Email({ ...email_info, user_id: user.user_id, main: true })
    await email.insert(txn)
    const role = Role.get('guest')
    await role.linkWithUser(user.user_id, txn)

    await txn.commit()

    return new ArisUser(user, [email], [role])
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
    const aux_ob: any = { ...this.user, emails: this.emails, roles: this.roles.map(role => role.title) }
    delete aux_ob.password
    aux_ob.emails!.map((email: Partial<Email>) => delete email.user_id)
    return <FormattedUser>aux_ob
  }

  /**
   * Checks if an user is already registered, and returns its id if so.
   */
  static async exist(email_address: string) {
    const email = await Email.get(email_address)
    return email.main ? email.user_id : false
  }

  /**
   * returns an Aris user.
   * @param identifier - an user id or email.
   */
  static async get(identifier: string | number) {
    const user_id = typeof identifier === 'string' ? (await Email.get(identifier)).user_id : identifier
    const user = await User.get(user_id)
    const emails = await Email.getUserEmails(user.user_id)
    const roles = await Role.getUserRoles(user.user_id)

    return new ArisUser(user, emails, roles)
  }

  /**
   * Select (with a filter or not) users.
   */
  static async getAll(filters: UserFilters, page: number, formatted?: boolean) {
    const users = await User.getAll(filters, page)
    const ids = users.map(user => user.user_id)
    const emails = await Email.getUsersEmails(ids)
    const roles = await Role.getUsersRoles(ids)

    return users.map(user => {
      const email = emails.filter(email => email.user_id === user.user_id)
      const role = roles[user.user_id]
      return formatted ? new ArisUser(user, email, role).format() : new ArisUser(user, email, role)
    })
  }

  // -----USER----- //

  /**
   * Updates the user`s information.
   */
  async updateUser({ name, surname, birthday, password, phone, avatar }: Partial<Omit<UserCtor, 'user_id' | 'created_at' | 'updated_at'>>) {
    if (name) this.user.name = name
    if (surname) this.user.surname = surname
    if (birthday) this.user.birthday = birthday
    if (password) this.user.password = await argon.hash(password)
    if (phone || phone === null) this.user.phone = phone
    if (avatar) this.user.avatar = avatar

    await this.user.update()
  }

  /**
   * Deletes an user and everything associated with it.
   */
  async deleteUser() {
    await this.user.delete()
  }

  /**
   * Verify the given password with the user`s hash.
   * @param password -string to be verified with the user`s hash.
   */
  async verifyPassword(password: string) {
    if (!(await argon.verify(this.user.password, password))) throw new ArisError('Incorrect password!', 400)
  }

  // -----EMAIL----- //

  /**
   * Adds an email for the user if it isn`t already registered.
   */
  async addEmail(email_info: Omit<EmailCtor, 'email_id' | 'user_id' | 'main'>) {
    const email = new Email({ ...email_info, user_id: this.user.user_id })
    await email.insert(this.txn)
    this.emails.push(email)
  }

  /**
   * Removes an email of the user.
   */
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
    this.roles.push(role)
  }

  /**
   * Updates a role for this user in the database.
   */
  async updateRole(prev_identifier: number | RoleTypes, new_identifier: number | RoleTypes) {
    const n_role = Role.get(new_identifier)
    const p_role = Role.get(prev_identifier)

    await db('user_role').update({ role_id: n_role.role_id }).where({ user_id: this.user.user_id, role_id: p_role.role_id })
    this.roles = this.roles.map(role => (role.title === p_role.title ? n_role : role))
  }

  /**
   * Removes a role for this user in the database.
   */
  async removeRole(identifier: number | RoleTypes) {
    const r_role = Role.get(identifier)
    await r_role.unLinkWithUser(this.user.user_id, this.txn)
    this.roles = this.roles.filter(role => role.role_id !== r_role.role_id)
  }

  // -----REQUESTS----- //

  /**
   * Makes a request for a new role if the user already don`t have it.
   * @param role -role to be requested.
   * @param data -info required for the role chosen.
   */
  async requestRole(role: RoleTypes, data: string) {
    if (this.roles.some(user_role => user_role.title === role)) throw new ArisError('User already have this role!', 400)

    const { role_id } = Role.get(role)
    if (await RoleReq.exist(this.user.user_id, role_id)) throw new ArisError('Request already exists!', 400)

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
