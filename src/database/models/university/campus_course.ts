import { Pagination } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface Campus_CourseFilters {
  university_id?: number | number[]
  campus_id?: number | number[]
  course_id?: number | number[]
}

export interface Campus_CourseCtor {
  university_id: number
  campus_id: number
  course_id: number
}

export default class Campus_Course1 {
  protected university_id: number
  protected campus_id: number
  protected course_id: number

  /**
   * Creates a campus course.
   */
  protected constructor({ university_id, campus_id, course_id }: Campus_CourseCtor) {
    this.university_id = university_id
    this.campus_id = campus_id
    this.course_id = course_id
  }

  protected async n_insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Campus_CourseCtor>>('campus_course').insert({
      university_id: this.university_id,
      campus_id: this.campus_id,
      course_id: this.course_id
    })
  }

  protected async n_delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Campus_CourseCtor>>('campus_course').del().where({ campus_id: this.campus_id, course_id: this.course_id })
  }

  protected static async n_find(filter: Campus_CourseFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<Campus_CourseCtor>>('campus_course').where(builder => {
      let key: keyof Campus_CourseFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface Campus_Course {
  university_id: Foreign
  campus_id: Foreign
  course_id: Foreign
}

const Campus_CourseModel = new Model<Campus_Course, never>('campus_course', { foreign: ['university_id', 'campus_id', 'course_id'] }, true)

type ICampus_CourseModel = IModel<Campus_Course, never>

export { Campus_CourseModel, ICampus_CourseModel }
