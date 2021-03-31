import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface StudentFilters {
  user_id?: number | number[]
  linkedin?: string | string[]
  lattes?: string | string[]
}

export interface StudentCtor {
  user_id: number
  linkedin?: string
  lattes?: string
}

export default class Student {
  protected user_id: number
  protected linkedin?: string
  protected lattes?: string

  /**
   * Creates an student.
   */
  protected constructor({ user_id, linkedin, lattes }: StudentCtor) {
    this.user_id = user_id
    this.linkedin = linkedin
    this.lattes = lattes
  }

  /**
   * Inserts this student in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<StudentCtor>>('student').insert({
      user_id: this.user_id,
      linkedin: this.linkedin,
      lattes: this.lattes
    })
  }

  /**
   * Updates this student in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const student_up = { linkedin: this.linkedin, lattes: this.lattes }

    await txn<Required<StudentCtor>>('student').update(student_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this student in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<StudentCtor>>('student').del().where({ user_id: this.user_id })
  }

  /**
   * returns an student if it`s registered in the database.
   */
  protected static async _find(filter: StudentFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<StudentCtor>>('student').where(builder => {
      let key: keyof StudentFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
