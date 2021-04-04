import Campus_Course, { Campus_CourseCtor, Campus_CourseFilters } from '../../database/models/university/campus_course'
import ArisError from '../arisError'
import Manage from './courseMan'

import { Pagination, CourseTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetCourse = Required<Campus_CourseCtor> & { name: CourseTypes }

export default class ArisCourse extends Campus_Course {
  private txn?: Transaction

  /**
   * Adds an new course to a campus.
   */
  static async add(university_id: number, campus_id: number, course: CourseTypes) {
    const course_id = Manage.find(course).get('course_id')
    const camp_course = new ArisCourse({ university_id, campus_id, course_id })
    await camp_course.n_insert()

    return course
  }

  /**
   * returns a parameter of course.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetCourse>(key: T): GetCourse[T] {
    const aux_ob = { university_id: this.university_id, campus_id: this.campus_id, ...this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of course infos.
   */
  format() {
    const aux_ob: Omit<GetCourse, 'university_id' | 'campus_id'> = {
      ...Manage.find(this.course_id).format()
    }
    return aux_ob
  }

  /**
   * Returns an Aris course.
   */
  static async find<T extends Campus_CourseFilters>(filter: T, pagination?: Pagination) {
    const courses_info = await this.n_find(filter, pagination)

    return <T extends { course_id: number } ? [ArisCourse] : ArisCourse[]>courses_info.map(course_info => new ArisCourse(course_info))
  }

  async delete() {
    await this.n_delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Manage = Manage

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
