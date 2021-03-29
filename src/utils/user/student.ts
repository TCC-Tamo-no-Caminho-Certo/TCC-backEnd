import Student, { StudentCtor, StudentFilters } from '../../database/models/user/student'
import Course from './studentCourse'
import ArisError from '../arisError'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetStudent = Required<Omit<StudentCtor, 'linkedin' | 'lattes'>> & Pick<StudentCtor, 'linkedin' | 'lattes'>

export default class ArisStudent extends Student {
  private txn?: Transaction

  /**
   * Creates an new student.
   */
  static async create(student_info: StudentCtor) {
    const student = new ArisStudent(student_info)
    await student._insert()

    return student
  }

  /**
   * returns a parameter of student.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetStudent>(key: T): GetStudent[T] {
    const aux_ob = { ...this.format(), user_id: this.user_id }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of student infos.
   */
  format() {
    const aux_ob: Omit<GetStudent, 'user_id'> = {
      linkedin: this.linkedin,
      lattes: this.lattes
    }
    return aux_ob
  }

  /**
   * Returns an Aris student.
   */
  static async find<T extends StudentFilters>(filter: T, pagination?: Pagination) {
    const students_info = await this._find(filter, pagination)

    return <T extends { user_id: number } ? [ArisStudent] : ArisStudent[]>students_info.map(student => new ArisStudent(student))
  }

  /**
   * Updates the student`s info.
   */
  async update({ linkedin, lattes }: Partial<Omit<StudentCtor, 'user_id'>>) {
    if (linkedin) this.linkedin = linkedin
    if (lattes) this.lattes = lattes

    await this._update(this.txn)
  }

  /**
   * Deletes this student.
   */
  async delete() {
    await this._delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Course = Course

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
