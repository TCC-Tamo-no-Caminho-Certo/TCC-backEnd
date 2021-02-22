import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface ProfessorFilters {
  user_id?: number | number[]
  full_time?: boolean
  postgraduated?: boolean
  lattes?: string | string[]
}

export interface ProfessorCtor {
  user_id: number
  full_time: boolean
  postgraduated: boolean
  lattes?: string
}

export default class Professor {
  protected user_id: number
  protected full_time: boolean
  protected postgraduated: boolean
  protected lattes?: string

  /**
   * Creates an professor.
   */
  protected constructor({ user_id, full_time, postgraduated, lattes }: ProfessorCtor) {
    this.user_id = user_id
    this.full_time = full_time
    this.postgraduated = postgraduated
    this.lattes = lattes
  }

  /**
   * Inserts this professor in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<ProfessorCtor>>('professor').insert({
      user_id: this.user_id,
      full_time: this.full_time,
      postgraduated: this.postgraduated,
      lattes: this.lattes
    })
  }

  /**
   * Updates this professor in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const professor_up = { full_time: this.full_time, postgraduated: this.postgraduated, lattes: this.lattes }

    await txn<Required<ProfessorCtor>>('professor').update(professor_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this professor in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<ProfessorCtor>>('professor').del().where({ user_id: this.user_id })
  }

  /**
   * returns an professor if it`s registered in the database.
   */
  protected static async _get(filter: ProfessorFilters) {
    const professor_info = await db<Required<ProfessorCtor>>('professor')
      .where(builder => {
        let key: keyof ProfessorFilters
        for (key in filter) {
          Array.isArray(filter[key]) ? builder.whereIn(<string>key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
        }
      })
      .then(row => (row[0] ? row : null))
    if (!professor_info) throw new ArisError('No professor found!', 400)

    return professor_info
  }
}
