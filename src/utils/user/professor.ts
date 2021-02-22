import Professor, { ProfessorCtor, ProfessorFilters } from '../../database/models/user/professor'
import ArisError from '../arisError'
import { Transaction } from 'knex'
import db from '../../database'

type FormattedProfessor = Required<Omit<ProfessorCtor, 'lattes'>> & Pick<ProfessorCtor, 'lattes'>

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
  get<T extends keyof FormattedProfessor>(key: T): FormattedProfessor[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of professor infos.
   */
  format() {
    const aux_ob: FormattedProfessor = { user_id: this.user_id, full_time: this.full_time, postgraduated: this.postgraduated, lattes: this.lattes }
    return aux_ob
  }

  /**
   * Returns an Aris professor.
   */
  static async get<T extends ProfessorFilters>(filter: T) {
    const professors_info = await this._get(filter)

    return <T extends { user_id: number } | { lattes: string } ? [ArisProfessor] : ArisProfessor[]>(
      professors_info.map(professor => new ArisProfessor(professor))
    )
  }

  /**
   * Updates the professor`s info.
   */
  async update({ full_time, postgraduated, lattes }: Partial<Omit<ProfessorCtor, 'user_id'>>) {
    if (full_time) this.full_time = full_time
    if (postgraduated) this.postgraduated = postgraduated
    if (lattes) this.lattes = lattes

    await this._update(this.txn)
  }

  /**
   * Deletes this professor.
   */
  async delete() {
    await this._delete(this.txn)
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
