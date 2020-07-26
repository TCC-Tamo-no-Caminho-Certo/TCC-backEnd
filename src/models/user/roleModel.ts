import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import db from '../../database'


export interface ArisRole {
  id_role?: number
  title: string
}

export default class Role {
  id_role: number
  title: string

  /**
   * Creates a role.
   */
  constructor({ id_role, title }: ArisRole) {
    this.id_role = id_role ? id_role : 0
    this.title = title
  }

  async insert() {

    const has_role = await Role.exist(this.title)
    if (has_role)
      throw new ArisError('Role already exists!', 400)

    const id_role = await db('role').insert({ title: this.title }).then(row => row[0])

    this.id_role = id_role
  }

  async update() {}

  async delete() {
    await db('role').del().where({ id_role: this.id_role })
  }

  static get = {
    async allRoles() {
      const roles = await db('role')
        .select()
        .then(row => row[0] ? row : null)

      return roles
    }
  }

  static async exist(title: string) {
    const has_role = await db('role').where({ title }).then(row => row[0] ? row[0] : null)
    return has_role ? true : false
  }

  static async getRole(title: string, transaction?: Transaction) {
    const trx = transaction || db
    const role_info = await trx('role').where({ title }).then(row => row[0] ? row[0] : null)
    if (!role_info) {
      transaction && transaction.rollback()
      throw new ArisError(`Role provided does't exists!`, 400)
    }

    return new Role(role_info)
  }
}