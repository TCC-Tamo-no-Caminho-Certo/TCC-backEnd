import ArisError from '../../utils/arisError'
import { Transaction } from 'knex'
import db from '../../database'

export type RoleTypes = 'admin' | 'guest' | 'aris' | 'student' | 'professor' | 'customer' | 'evaluator' | 'moderator'

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

  async linkWithUser(user_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('user_role').insert({ role_id: this.role_id, user_id })
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

  static async getRole(identifier: RoleTypes | number, transaction?: Transaction) {
    const trx = transaction || db

    const role_info = await trx('role')
      .where(typeof identifier === 'string' ? { title: identifier } : { role_id: identifier })
      .then(row => (row[0] ? row[0] : null))
    if (!role_info) {
      transaction && transaction.rollback()
      throw new ArisError(`Role provided does't exists!`, 400)
    }

    return new Role(role_info)
  }

  static async getAllRoles() {
      const roles = await db('role')
        .then(row => (row[0] ? row : null))

      return roles
  }
}
