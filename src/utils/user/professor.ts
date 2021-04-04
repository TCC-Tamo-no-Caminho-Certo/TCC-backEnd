import Professor, { ProfessorCtor, ProfessorFilters } from '../../database/models/user/professor'
import Course from './professorUniversity'
import ArisError from '../arisError'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetProfessor = Required<Omit<ProfessorCtor, 'linkedin' | 'lattes' | 'orcid'>> & Pick<ProfessorCtor, 'linkedin' | 'lattes' | 'orcid'>

export default class ArisProfessor extends Professor {
  private txn?: Transaction

  /**
   * Creates an new professor.
   */
  static async create(professor_info: ProfessorCtor) {
    const professor = new ArisProfessor(professor_info)
    await professor._insert()

    return professor
  }

  /**
   * returns a parameter of professor.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetProfessor>(key: T): GetProfessor[T] {
    const aux_ob = { user_id: this.user_id, ...this.format() }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of professor infos.
   */
  format() {
    const aux_ob: Omit<GetProfessor, 'user_id'> = {
      postgraduate: this.postgraduate,
      linkedin: this.linkedin,
      lattes: this.lattes,
      orcid: this.orcid
    }
    return aux_ob
  }

  /**
   * Returns an Aris professor.
   */
  static async find<T extends ProfessorFilters>(filter: T, pagination?: Pagination) {
    const professors_info = await this._find(filter, pagination)

    return <T extends { user_id: number } ? [ArisProfessor] : ArisProfessor[]>(
      professors_info.map(professor => new ArisProfessor(professor))
    )
  }

  /**
   * Updates the professor`s info.
   */
  async update({ postgraduate, linkedin, lattes, orcid }: Partial<Omit<ProfessorCtor, 'user_id'>>) {
    if (postgraduate) this.postgraduate = postgraduate
    if (linkedin) this.linkedin = linkedin
    if (lattes) this.lattes = lattes
    if (orcid) this.orcid = orcid

    await this._update(this.txn)
  }

  /**
   * Deletes this professor.
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
