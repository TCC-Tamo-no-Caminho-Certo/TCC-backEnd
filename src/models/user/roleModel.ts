import ArisError from '../../utils/arisError'
import { Transaction } from 'knex'
import db from '../../database'

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

  async insert() {
    const has_role = await Role.exist(this.title)
    if (has_role) throw new ArisError('Role already exists!', 400)

    const role_id = await db('role')
      .insert({ title: this.title })
      .then(row => row[0])

    this.role_id = role_id
  }

  async update() {}

  async delete() {
    await db('role').del().where({ role_id: this.role_id })
  }

  static async exist(title: string) {
    const has_role = await db('role')
      .where({ title })
      .then(row => (row[0] ? row[0] : null))
    return has_role ? true : false
  }

  static getRole(identifier: RoleTypes | number) {
    const role = roles.find(role => typeof identifier === 'string' ? role.title === identifier : role.role_id = identifier)
    if(!role) throw new ArisError(`Role provided does't exists!`, 400)
    return role
  }

  static async getAllRoles() {
    const roles = await db('role').then(row => (row[0] ? row : false))
    return roles
  }

  // -----USER_ROLE----- //

  async linkWithUser(user_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('user_role').insert({ role_id: this.role_id, user_id })
  }
}

Role.getAllRoles().then(row => {
  if (!row) throw new ArisError('Couldn´t get all roles', 500)
  roles = row.map(role_info => new Role(role_info))
})
