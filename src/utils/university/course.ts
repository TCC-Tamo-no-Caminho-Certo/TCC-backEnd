import Campus_Course, { Campus_CourseCtor, Campus_CourseFilters } from '../../database/models/university/campus_course'
import Course from '../../database/models/university/course'
import ArisError from '../arisError'

import { Pagination, CourseTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetCourse = Required<Campus_CourseCtor> & { name: CourseTypes }

export default class ArisCourse extends Campus_Course {
  private txn?: Transaction

  /**
   * returns a parameter of course.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetCourse>(key: T): GetCourse[T] {
    const aux_ob = { campus_id: this.campus_id, course_id: this.course_id, name: this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of course infos.
   */
  format() {
    return Course.find(this.course_id).name
  }

  /**
   * Returns an Aris course.
   */
  static async find(filter: Campus_CourseFilters, pagination?: Pagination) {
    const courses_info = await this.n_find(filter, pagination)

    return courses_info.map(course_info => new ArisCourse(course_info))
  }

  async delete() {
    await this.n_delete(this.txn)
  }

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
