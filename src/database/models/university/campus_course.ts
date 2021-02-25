import ArisError from '../../../utils/arisError'
import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface Campus_CourseFilters {
  campus_id?: number | number[]
  course_id?: number | number[]
}

export interface Campus_CourseCtor {
  campus_id: number
  course_id: number
}

export default class Campus_Course {
  protected campus_id: number
  protected course_id: number

  /**
   * Creates a campus course.
   */
  protected constructor({ campus_id, course_id }: Campus_CourseCtor) {
    this.campus_id = campus_id
    this.course_id = course_id
  }

  protected async n_insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<Campus_CourseCtor>>('campus_course').insert({ campus_id: this.campus_id, course_id: this.course_id })
  }

  protected async n_delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<Campus_CourseCtor>>('campus_course').del().where({ campus_id: this.campus_id, course_id: this.course_id })
  }

  protected static async n_find(filter: Campus_CourseFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50
    if (page <= 0) throw new ArisError('Invalid page value', 400)
    if (per_page > 100) throw new ArisError('Maximum limt per page exceeded!', 400)

    const base_query = db<Required<Campus_CourseCtor>>('campus_course').where(builder => {
      let key: keyof Campus_CourseFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
