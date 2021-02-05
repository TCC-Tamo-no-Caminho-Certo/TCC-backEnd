import Email, { ArisEmail } from './emailModel'
import Role, { RoleTypes } from './roleModel'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'
import { Transaction } from 'knex'
import db from '../../database'

interface Filters {
  ids?: number[]
  name?: string[]
  created_at?: [string, string]
  updated_at?: [string, string]
}

export interface ArisUser {
  user_id?: number
  name: string
  surname: string
  emails?: Email[]
  phone?: string
  birthday: string
  password: string
  avatar?: string
  roles: RoleTypes[]
  created_at?: string
  updated_at?: string
}

export default class User {
  user_id: number
  name: string
  surname: string
  emails: Email[]
  phone?: string
  birthday: string
  password: string
  avatar: string
  roles: RoleTypes[]
  created_at?: string
  updated_at?: string

  /**
   * Creates an user.
   */
  constructor({ user_id, name, surname, emails, avatar, birthday, password, roles, phone, created_at, updated_at }: ArisUser) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.emails = emails || []
    this.phone = phone
    this.birthday = birthday
    this.password = password
    this.avatar = avatar || 'default'
    this.roles = roles
    this.created_at = created_at
    this.updated_at = updated_at
  }

  /**
   * Inserts this user in the database, if doesn't already registered.
   * @param User.password - needs to be hashed!
   */
  async insert() {
    const trx = await db.transaction()

    const role = Role.getRole(this.roles[0])

    this.user_id = await trx('user')
      .insert({
        name: this.name,
        surname: this.surname,
        birthday: this.birthday,
        password: this.password,
        active: true
      })
      .then(row => row[0])

    await role.linkWithUser(this.user_id, trx)

    await trx.commit()
  } // Take role functions out of insert

  /**
   * Updates this user in the database.
   * @param User.password - needs to be hashed!
   */
  async update(transaction?: Transaction) {
    const trx = transaction || db

    const user_up: Partial<this> = { ...this }
    delete user_up.user_id
    delete user_up.emails
    delete user_up.roles
    delete user_up.created_at
    delete user_up.updated_at

    await trx('user').update(user_up).where({ user_id: this.user_id })

    this.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }

  /**
   * Delets this user in the database.
   */
  async delete() {
    await db('user').del().where({ user_id: this.user_id })
  }

  /**
   * Checks if an user is already registered, and returns its id if so.
   */
  static async exist(email: string) {
    const user_id: number | boolean = await db('email')
      .select('user_id')
      .where({ email })
      .then(row => (row[0] ? row[0].user_id : false))
    return user_id
  }

  /**
   * returns an user if it`s registered in the database.
   * @param identifier - an user id or email.
   */
  static async getUser(identifier: string | number): Promise<User> {
    let user_id =
      typeof identifier === 'string'
        ? await db('email')
            .select('user_id')
            .where({ address: identifier, main: true })
            .then(row => (row[0] ? row[0].user_id : null))
        : identifier

    const user_info: ArisUser = await db('user')
      .where({ user_id })
      .then(row => (row[0] ? Data.parseDatetime(row[0]) : null))
    if (!user_info) throw new ArisError('User don`t exists!', 400)

    const email_info = await db('email')
      .select('email_id', 'address', 'main', 'options')
      .where({ user_id: user_info.user_id })
      .then(row => (row[0] ? row : null))
    if (!email_info) throw new ArisError('Couldn`t found user emails!', 500)
    user_info.emails = email_info.map(email => new Email(email))

    const roles = await db('user_role_view')
      .select('title')
      .where({ user_id: user_info.user_id })
      .then(row => (row[0] ? row.map(role => role.title) : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)
    user_info.roles = roles

    return new User(user_info)
  }

  /**
   * Select (with a filter or not) users.
   */
  static async getAllUsers(filters: Filters, page: number) {
    const ids = await db('user')
      .select('user_id')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('user_id', filters.ids)
        if (filters.name) builder.where('full_name', 'like', `%${filters.name}%`)
        if (filters.created_at && filters.created_at[0]) builder.whereBetween('created_at', filters.created_at)
        if (filters.updated_at && filters.updated_at[0]) builder.whereBetween('updated_at', filters.updated_at)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => row.map(user => user.user_id))

    const users = await db<ArisUser>('user')
      .whereIn('user_id', ids)
      .then(row => (row[0] ? row : null))
    if (!users) throw new ArisError('Didn´t find any user!', 400)

    const emails = await db('email')
      .whereIn('user_id', ids)
      .then(row => (row[0] ? row : null))
    if (!emails) throw new ArisError('Couldn`t found user emails!', 500)

    const roles = await db('user_role_view')
      .whereIn('user_id', ids)
      .then(row => (row[0] ? row : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)

    users.map(user => {
      user.emails = emails.filter(email => email.user_id === user.user_id).map(email => new Email(email))
      user.roles = roles.filter(role => role.user_id === user.user_id).map(role => role.title)
    })
    return users
  } // organize data with map instead of for loop

  // -----EMAIL----- //

  async addEmail({ address, main, options }: ArisEmail) {
    const email = new Email({ address, main, options })
    await email.insert(this.user_id)
    this.emails.push(email)
  }

  // -----ROLE----- //

  /**
   * Adds a role for this user in the database.
   */
  async addRole(identifier: number | RoleTypes) {
    const role = Role.getRole(identifier)
    await role.linkWithUser(this.user_id)
    this.roles.push(role.title)
  }

  /**
   * Updates a role for this user in the database.
   */
  async updateRole(prev_role: RoleTypes, new_role: RoleTypes) {
    const n_role = Role.getRole(new_role)
    const p_role = Role.getRole(prev_role)

    await db('user_role').update({ role_id: n_role.role_id }).where({ role_id: p_role.role_id })
    this.roles = this.roles.map(role => (role === p_role.title ? n_role.title : role))
  }

  /**
   * Removes a role for this user in the database.
   */
  async removeRole(identifier: number | RoleTypes) {
    const r_role = Role.getRole(identifier)

    await db('user_role').del().where({ user_id: this.user_id, role_id: r_role.role_id })
    this.roles = this.roles.filter(role => role !== r_role.title)
  }
}
