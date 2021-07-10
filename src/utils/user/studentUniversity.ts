import Student_University, { Student_UniversityCtor, Student_UniversityFilters } from '../../database/models/user/student_university'
import ArisError from '../arisError'

import { Pagination } from '../../@types/types'

import { Knex } from 'knex'
import db from '../../database'

type GetStudentCourse = Required<Student_UniversityCtor>

export default class ArisStudentUniversity extends Student_University {
  private txn?: Knex.Transaction

  static async add(student_course_info: Student_UniversityCtor) {
    const student_course = new ArisStudentUniversity(student_course_info)
    await student_course._insert()

    return student_course
  }

  /**
   * returns a parameter of role.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetStudentCourse>(key: T): GetStudentCourse[T] {
    const aux_ob = { user_id: this.user_id, ...this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role infos.
   */
  format() {
    const aux_ob: Omit<GetStudentCourse, 'user_id'> = {
      university_id: this.university_id,
      campus_id: this.campus_id,
      course_id: this.course_id,
      register: this.register,
      semester: this.semester
    }
    return aux_ob
  }

  /**
   * Returns an Aris role.
   */
  static async find(filter: Student_UniversityFilters, pagination?: Pagination) {
    const students_info = await this._find(filter, pagination)

    return students_info.map(student_info => new ArisStudentUniversity(student_info))
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
