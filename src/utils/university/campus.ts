import Campus, { CampusCtor, CampusFilters } from '../../database/models/university/campus'
import ArisError from '../arisError'
import Course from './course'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetCampus = Required<CampusCtor>

export default class ArisCampus extends Campus {
  private txn?: Transaction

  /**
   * Creates an new campus.
   */
  static async create(campus_info: Omit<CampusCtor, 'campus_id'>) {
    const campus = new ArisCampus(campus_info)
    await campus._insert()

    return campus
  }

  /**
   * returns a parameter of campus.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetCampus>(key: T): GetCampus[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of campus infos.
   */
  format() {
    const aux_ob: GetCampus = {
      campus_id: this.campus_id,
      university_id: this.university_id,
      name: this.name
    }
    return aux_ob
  }

  /**
   * Returns an Aris campus array.
   */
  static async find<T extends CampusFilters>(filter: T, pagination?: Pagination) {
    const campus = await this._find(filter, pagination)

    return <T extends { campus_id: number } ? [ArisCampus] : ArisCampus[]>campus.map(camp => new ArisCampus(camp))
  }

  /**
   * Updates the campus`s information.
   */
  async update({ name }: Partial<Omit<CampusCtor, 'campus_id' | 'university_id'>>) {
    if (name) this.name = name

    await this._update(this.txn)
  }

  /**
   * Deletes an campus and everything associated with it.
   */
  async delete() {
    await this._delete(this.txn)
  }

  // -----COMPLEMENTARY CLASSES----- //

  static Course = Course

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
