import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export type RoleTypes = 'admin' | 'guest' | 'student' | 'professor' | 'customer' | 'evaluator' | 'moderator'

let roles: Role[]

export interface RoleCtor {
  role_id?: number
  title: RoleTypes
}

export default class Role {
  role_id: number
  title: RoleTypes

  /**
   * Creates a role.
   */
  constructor({ role_id, title }: RoleCtor) {
    this.role_id = role_id || 0 //Gives a temporary id when creating a new role
    this.title = title
  }

  static get(identifier: RoleTypes | number) {
    const role = roles.find(role => (typeof identifier === 'string' ? role.title === identifier : role.role_id === identifier))
    if (!role) throw new ArisError(`Role provided does't exists!`, 400)
    return role
  }

  static async getAll() {
    const roles = await db('role').then(row => (row[0] ? row : false))
    return roles
  }

  // -----USER_ROLE----- //

  async linkWithUser(user_id: number, transaction?: Transaction) {
    const txn = transaction || db

    await txn('user_role').insert({ role_id: this.role_id, user_id })
  }

  async unLinkWithUser(user_id: number, transaction?: Transaction) {
    const txn = transaction || db

    await txn('user_role').del().where({ role_id: this.role_id, user_id })
  }

  static async getUserRoles(user_id: number) {
    const roles = await db('user_role')
      .where({ user_id })
      .then(row => (row[0] ? row : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)

    return roles.map(role => Role.get(role.role_id))
  }

  static async getUsersRoles(users_ids: number[]) {
    const result: { [user_id: number]: Role[] } = {}
    const roles = await db('user_role')
      .whereIn('user_id', users_ids)
      .then(row => (row[0] ? row : null))
    if (!roles) throw new ArisError('Couldn`t found users roles!', 500)

    roles.map(role => (result[role.user_id] ? result[role.user_id].push(Role.get(role.role_id)) : (result[role.user_id] = [Role.get(role.role_id)])))

    return result
  }
}

Role.getAll().then(row => {
  if (!row) throw new ArisError('Couldn´t get all roles', 500)
  roles = row.map(role_info => new Role(role_info))
})
