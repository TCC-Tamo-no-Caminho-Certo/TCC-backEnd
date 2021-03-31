import Course, { CourseCtor } from '../../database/models/university/course'
import ArisError from '../arisError'

import { CourseTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetRole = Required<CourseCtor>

export default class ArisCourseManagement extends Course {
  private txn?: Transaction

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
    const aux_ob: GetRole = { course_id: this.course_id, name: this.name }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static find(identifier: CourseTypes | number) {
    const course_info = this._find(identifier)

    return new ArisCourseManagement(course_info)
  }

  /**
   * Returns all Aris roles.
   */
  static findAll() {
    const courses_info = this._findAll()

    return courses_info.map(course_info => new ArisCourseManagement(course_info))
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
