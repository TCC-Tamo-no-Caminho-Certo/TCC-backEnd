import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface ProfessorFilters {
  user_id?: number | number[]
  postgraduate?: boolean
  linkedin?: string | string[]
  lattes?: string | string[]
  orcid?: string | string[]
}

export interface ProfessorCtor {
  user_id: number
  postgraduate: boolean
  linkedin?: string
  lattes?: string
  orcid?: string
}

export default class Professor {
  protected user_id: number
  protected postgraduate: boolean
  protected linkedin?: string
  protected lattes?: string
  protected orcid?: string

  /**
   * Creates an professor.
   */
  protected constructor({ user_id, postgraduate, linkedin, lattes, orcid }: ProfessorCtor) {
    this.user_id = user_id
    this.postgraduate = postgraduate
    this.linkedin = linkedin
    this.lattes = lattes
    this.orcid = orcid
  }

  /**
   * Inserts this professor in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<ProfessorCtor>>('professor').insert({
      user_id: this.user_id,
      postgraduate: this.postgraduate,
      linkedin: this.linkedin,
      lattes: this.lattes,
      orcid: this.orcid
    })
  }

  /**
   * Updates this professor in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const professor_up = { postgraduate: this.postgraduate, linkedin: this.linkedin, lattes: this.lattes, orcid: this.orcid }

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
  protected static async _find(filter: ProfessorFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<ProfessorCtor>>('professor').where(builder => {
      let key: keyof ProfessorFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
