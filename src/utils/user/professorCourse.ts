import Professor_Course, { Professor_CourseCtor, Professor_CourseFilters } from '../../database/models/user/professor_course'
import ArisError from '../arisError'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetProfessorCourse = Required<Professor_CourseCtor>

export default class ArisProfessorCourse extends Professor_Course {
  private txn?: Transaction

  static async add(professor_course_info: Professor_CourseCtor) {
    const professor_course = new ArisProfessorCourse(professor_course_info)
    await professor_course._insert()

    return professor_course
  }

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetProfessorCourse>(key: T): GetProfessorCourse[T] {
    const aux_ob = { user_id: this.user_id, ...this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    const aux_ob: Omit<GetProfessorCourse, 'user_id'> = {
      campus_id: this.campus_id,
      course_id: this.course_id,
      register: this.register,
      full_time: this.full_time
    }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static async find(filter: Professor_CourseFilters, pagination?: Pagination) {
    const roles_info = await this._find(filter, pagination)

    return roles_info.map(role_info => new ArisProfessorCourse(role_info))
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
