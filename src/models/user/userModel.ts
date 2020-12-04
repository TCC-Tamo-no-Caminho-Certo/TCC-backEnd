import BaseUser, { ArisBaseUser } from './baseUserModel'
import Role, { RoleTypes } from './roleModel'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'
import db from '../../database'

export interface ArisUser extends ArisBaseUser {
  cpf: string
  phone?: string
  roles: RoleTypes[]
}

export default class User extends BaseUser {
  cpf: string
  phone?: string

  /**
   * Creates an user.
   */
  constructor({ user_id, name, surname, emails, avatar, birthday, password, cpf, roles, phone, created_at, updated_at }: ArisUser) {
    super({ user_id, name, surname, emails, avatar, birthday, password, created_at, updated_at })
    this.phone = phone
    this.roles = roles
    this.cpf = cpf
  }

  /**
   * Aris User can´t be inserted.
   */
  async insert() {
    throw new Error('Aris User can´t be inserted!')
  }

  /**
   * Adds a role for this user in the database.
   */
  async addRole(role_id: number) {
    const role = await Role.getRole(role_id)

    if (this.roles.some(role => role === 'aris user')) {
      const { role_id: base_id } = await Role.getRole('aris user')
      await db('user_role').update({ role_id }).where({ user_id: this.user_id, role_id: base_id })
      this.roles = [role.title]
    } else {
      await db('user_role').insert({ user_id: this.user_id, role_id })
      this.roles.push(role.title)
    }
  }

  /**
   * Updates a role for this user in the database.
   */
  async updateRole(new_role: RoleTypes, prev_role: RoleTypes) {
    const n_role = await Role.getRole(new_role)
    const p_role = await Role.getRole(prev_role)

    await db('user_role').update({ role_id: n_role.role_id }).where({ role_id: p_role.role_id })
    this.roles = this.roles.map(role => (role === p_role.title ? n_role.title : role))
  }

  /**
   * Removes a role for this user in the database.
   */
  async removeRole(role_id: number) {
    const r_role = await Role.getRole(role_id)

    await db('user_role').del().where({ user_id: this.user_id, role_id })
    this.roles = this.roles.filter(role => role !== r_role.title)
  }

  /**
   * returns an user if it`s registered in the database
   * @param identifier - an user id or email
   */
  static async getUser(identifier: string | number): Promise<User | BaseUser> {
    const trx = await db.transaction()

    let user_id =
      typeof identifier === 'string'
        ? await trx('email')
            .select('user_id')
            .where({ email: identifier, main: true })
            .then(row => (row[0] ? row[0].user_id : null))
        : identifier

    const user_info: ArisUser = await trx('user')
      .where({ user_id })
      .then(row => (row[0] ? Data.parseDatetime(row[0]) : null))
    if (!user_info) throw new ArisError('User don`t exists!', 403)

    const email_info = await trx('email')
      .select('email', 'main', 'options')
      .where({ user_id: user_info.user_id })
      .then(row => (row[0] ? row : null))
    if (!email_info) throw new ArisError('Couldn`t found user emails!', 500)
    user_info.emails = email_info

    const roles = await trx('user_role_view')
      .select('title')
      .where({ user_id: user_info.user_id })
      .then(row => (row[0] ? row.map(role => role.title) : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)
    user_info.roles = roles

    if (user_info.roles.some(role => role === 'base user')) return new BaseUser(user_info)
    return new User(user_info)
  }
}
