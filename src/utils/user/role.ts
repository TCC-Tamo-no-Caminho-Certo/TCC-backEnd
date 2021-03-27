import User_Role, { User_RoleCtor, User_RoleFilters } from '../../database/models/user/user_role'
import ArisError from '../arisError'
import Professor from './professor'
import Student from './student'
import Request from './roleReq'
import Manage from './roleMan'

import { Pagination, RoleTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetRole = Required<User_RoleCtor> & { title: RoleTypes }

export default class ArisRole extends User_Role {
  private txn?: Transaction

  static async add(user_id: number, role: RoleTypes) {
    const role_id = Manage.find(role).get('role_id')
    const user_role = new ArisRole({ user_id, role_id })
    await user_role.n_insert()
    return user_role
  }

  static async remove(user_id: number, role: RoleTypes) {
    const role_id = Manage.find(role).get('role_id')
    await new ArisRole({ user_id, role_id }).n_delete()
  }

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetRole>(key: T): GetRole[T] {
    const aux_ob = { user_id: this.user_id, role_id: this.role_id, title: this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    return Manage.find(this.role_id).get('title')
  }

  /**
   * Returns an Aris role.
   */
  static async find(filter: User_RoleFilters, pagination?: Pagination) {
    const roles_info = await this.n_find(filter, pagination)

    return roles_info.map(role_info => new ArisRole(role_info))
  }

  async remove() {
    await this.n_delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Request = Request

  static Manage = Manage

  static Professor = Professor

  static Student = Student

  // -----TRANSACTION----- //

  /**
   * Creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * Bind a transaction to this class.
   */
  setTxn(txn: Transaction) {
    this.txn = txn
  }

  /**
   * Commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }

  /**
   * Rollback the transaction.
   */
  async rollbackTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.rollback()
  }
}
