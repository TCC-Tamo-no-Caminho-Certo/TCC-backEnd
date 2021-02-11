import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export type RoleTypes = 'admin' | 'guest' | 'student' | 'professor' | 'customer' | 'evaluator' | 'moderator'

let roles: Role[]

export interface ArisRole {
  role_id?: number
  title: RoleTypes
}

export default class Role {
  role_id: number
  title: RoleTypes

  /**
   * Creates a role.
   */
  constructor({ role_id, title }: ArisRole) {
    this.role_id = role_id ? role_id : 0
    this.title = title
  }

  static get(identifier: RoleTypes | number) {
    const role = roles.find(role => (typeof identifier === 'string' ? role.title === identifier : (role.role_id = identifier)))
    if (!role) throw new ArisError(`Role provided does't exists!`, 400)
    return role
  }

  static async getAll() {
    const roles = await db('role').then(row => (row[0] ? row : false))
    return roles
  }

  // -----USER_ROLE----- //

  async linkWithUser(user_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('user_role').insert({ role_id: this.role_id, user_id })
  }

  async unLinkWithUser(user_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('user_role').del().where({ role_id: this.role_id, user_id })
  }

  static async getUserRoles(user_id: number): Promise<RoleTypes[]> {
    const roles = await db('user_role_view')
      .select('title')
      .where({ user_id })
      .then(row => (row[0] ? row.map(role => role.title) : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)
    return roles
  }

  static async getUsersRoles(user_ids: number[]): Promise<{ user_id: number; title: RoleTypes }[]> {
    const roles = await db('user_role_view')
      .whereIn('user_id', user_ids)
      .then(row => (row[0] ? row : null))
    if (!roles) throw new ArisError('Couldn`t found users roles!', 500)
    return roles
  }
}

Role.getAll().then(row => {
  if (!row) throw new ArisError('Couldn´t get all roles', 500)
  roles = row.map(role_info => new Role(role_info))
})
