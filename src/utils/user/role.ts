import Role, { RoleTypes } from '../../database/models/user/role'
import User_Role from '../../database/models/user/user_role'
import Professor from '../../database/models/user/professor'
import Student from '../../database/models/user/student'
import ArisError from '../arisError'
import { Transaction } from 'knex'
import db from '../../database'
import Request from './roleReq'

type FormattedRole = { user_id: number; title: RoleTypes }

export default class ArisRole extends User_Role {
  private txn?: Transaction

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedRole>(key: T): FormattedRole[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    const aux_ob: FormattedRole = { user_id: this.user_id, title: Role.get(this.role_id).title }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static async get<T extends boolean = false>(user_id: number | number[], formatted?: T) {
    const roles_info = await super.n_get(user_id)

    return <T extends true ? FormattedRole[] : ArisRole[]>(
      roles_info.map(role_info => (formatted ? new ArisRole(role_info).format() : new ArisRole(role_info)))
    )
  }

  async delete() {
    await super.n_delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Request = Request

  static Professor = Professor

  static Student = Student

  // -----TRANSACTION----- //

  /**
   * creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }
}
