import Moderator_University, { Moderator_UniversityCtor, Moderator_UniversityFilters } from '../../database/models/user/moderator_university'
import ArisError from '../arisError'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetModeratorCourse = Required<Moderator_UniversityCtor>

export default class ArisModeratorUniversity extends Moderator_University {
  private txn?: Transaction

  static async add(Moderator_course_info: Moderator_UniversityCtor) {
    const Moderator_course = new ArisModeratorUniversity(Moderator_course_info)
    await Moderator_course._insert()

    return Moderator_course
  }

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetModeratorCourse>(key: T): GetModeratorCourse[T] {
    const aux_ob = { user_id: this.user_id, ...this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    const aux_ob: Omit<GetModeratorCourse, 'user_id'> = {
      university_id: this.university_id
    }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static async find(filter: Moderator_UniversityFilters, pagination?: Pagination) {
    const moderators_info = await this._find(filter, pagination)

    return moderators_info.map(moderator_info => new ArisModeratorUniversity(moderator_info))
  }

  async remove() {
    await this._delete(this.txn)
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
