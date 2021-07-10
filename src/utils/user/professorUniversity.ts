import Professor_University, { Professor_UniversityCtor, Professor_UniversityFilters } from '../../database/models/user/professor_university'
import ArisError from '../arisError'

import { Pagination } from '../../@types/types'

import { Knex } from 'knex'
import db from '../../database'

type GetProfessorCourse = Required<Professor_UniversityCtor>

export default class ArisProfessorUniversity extends Professor_University {
  private txn?: Knex.Transaction

  static async add(professor_course_info: Professor_UniversityCtor) {
    const professor_course = new ArisProfessorUniversity(professor_course_info)
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
      university_id: this.university_id,
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
  static async find<T extends Professor_UniversityFilters>(filter: T, pagination?: Pagination) {
    const professors_info = await this._find(filter, pagination)

    return <T extends { user_id: number; university_id: number } ? [ArisProfessorUniversity] : ArisProfessorUniversity[]>(
      professors_info.map(professor_info => new ArisProfessorUniversity(professor_info))
    )
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
