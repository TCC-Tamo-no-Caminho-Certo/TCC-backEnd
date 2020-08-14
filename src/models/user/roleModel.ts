import ArisError from '../../utils/arisError'
import { Transaction } from 'knex'
import db from '../../database'

export type RoleTypes = 'admin' | 'base user' | 'student' | 'professor' | 'proponent'

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

  static get = {
    async allRoles() {
      const roles = await db('role')
        .select()
        .then(row => (row[0] ? row : null))

      return roles
    }
  }

  static async exist(title: string) {
    const has_role = await db('role')
      .where({ title })
      .then(row => (row[0] ? row[0] : null))
    return has_role ? true : false
  }

  static async getRole(title: string, transaction?: Transaction) {
    const trx = transaction || db
    const role_info = await trx('role')
      .where({ title })
      .then(row => (row[0] ? row[0] : null))
    if (!role_info) {
      transaction && transaction.rollback()
      throw new ArisError(`Role provided does't exists!`, 400)
    }

    return new Role(role_info)
  }
}
