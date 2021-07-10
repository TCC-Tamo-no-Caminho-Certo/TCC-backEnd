import Role, { RoleCtor } from '../../database/models/user/role'
import ArisError from '../arisError'

import { RoleTypes } from '../../@types/types'

import { Knex } from 'knex'
import db from '../../database'

type GetRole = Required<RoleCtor>

export default class ArisRoleManagement extends Role {
  private txn?: Knex.Transaction

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetRole>(key: T): GetRole[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    const aux_ob: GetRole = { role_id: this.role_id, title: this.title }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static find(identifier: RoleTypes | number) {
    const role_info = this._find(identifier)

    return new ArisRoleManagement(role_info)
  }

  /**
   * Returns all Aris roles.
   */
  static findAll() {
    const roles_info = this._findAll()

    return roles_info.map(role_info => new ArisRoleManagement(role_info))
  }

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
  setTxn(txn: Knex.Transaction) {
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
