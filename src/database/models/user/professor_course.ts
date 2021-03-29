import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface Professor_CourseFilters {
  user_id?: number | number[]
  course_id?: number | number[]
  campus_id?: number | number[]
  full_time?: boolean
}

export interface Professor_CourseCtor {
  user_id: number
  course_id: number
  campus_id: number
  full_time: boolean
}

export default class Professor_course {
  protected user_id: number
  protected course_id: number
  protected campus_id: number
  protected full_time: boolean

  /**
   * Creates an professor.
   */
  protected constructor({ user_id, course_id, campus_id, full_time }: Professor_CourseCtor) {
    this.user_id = user_id
    this.course_id = course_id
    this.campus_id = campus_id
    this.full_time = full_time
  }

  /**
   * Inserts this professor in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<Professor_CourseCtor>>('professor_course').insert({
      user_id: this.user_id,
      course_id: this.course_id,
      campus_id: this.campus_id,
      full_time: this.full_time
    })
  }

  /**
   * Updates this professor in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const professor_up = { full_time: this.full_time }

    await txn<Required<Professor_CourseCtor>>('professor_course').update(professor_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this professor in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<Professor_CourseCtor>>('professor_course').del().where({ user_id: this.user_id })
  }

  /**
   * returns an professor if it`s registered in the database.
   */
  protected static async _find(filter: Professor_CourseFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<Professor_CourseCtor>>('professor_course').where(builder => {
      let key: keyof Professor_CourseFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
