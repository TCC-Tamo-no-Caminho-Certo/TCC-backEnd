import University, { UniversityCtor, UniversityFilters } from '../../database/models/university/university'
import ArisError from '../arisError'
import Campus from './campus'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetUniversity = Required<UniversityCtor>

export default class ArisUniversity extends University {
  private txn?: Transaction

  /**
   * Creates an new university.
   */
  static async create(university_info: Omit<UniversityCtor, 'university_id'>) {
    const university = new ArisUniversity(university_info)
    await university._insert()

    return university
  }

  /**
   * returns a parameter of university.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetUniversity>(key: T): GetUniversity[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of university infos.
   */
  format() {
    const aux_ob: GetUniversity = {
      university_id: this.university_id,
      name: this.name,
      professor_regex: this.professor_regex,
      student_regex: this.student_regex
    }
    return aux_ob
  }

  /**
   * Returns an Aris university array.
   */
  static async find<T extends UniversityFilters>(filter: T, pagination?: Pagination) {
    const universities = await this._find(filter, pagination)

    return <T extends { university_id: number } ? [ArisUniversity] : ArisUniversity[]>universities.map(university => new ArisUniversity(university))
  }

  /**
   * Updates the university`s information.
   */
  async update({ name, professor_regex, student_regex }: Partial<Omit<UniversityCtor, 'university_id'>>) {
    if (name) this.name = name
    if (professor_regex) this.professor_regex = professor_regex
    if (student_regex) this.student_regex = student_regex

    await this._update(this.txn)
  }

  /**
   * Deletes an university and everything associated with it.
   */
  async delete() {
    await this._delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Campus = Campus

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
