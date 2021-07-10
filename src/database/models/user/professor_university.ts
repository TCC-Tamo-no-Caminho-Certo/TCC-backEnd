import { Pagination } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface Professor_UniversityFilters {
  user_id?: number | number[]
  course_id?: number | number[]
  campus_id?: number | number[]
  university_id?: number | number[]
  register?: number | number[]
  full_time?: boolean
}

export interface Professor_UniversityCtor {
  user_id: number
  course_id: number
  campus_id: number
  university_id: number
  register: number
  full_time: boolean
}

export default class Professor_University1 {
  protected user_id: number
  protected course_id: number
  protected campus_id: number
  protected university_id: number
  protected register: number
  protected full_time: boolean

  /**
   * Creates an professor.
   */
  protected constructor({ user_id, course_id, campus_id, university_id, register, full_time }: Professor_UniversityCtor) {
    this.user_id = user_id
    this.course_id = course_id
    this.campus_id = campus_id
    this.university_id = university_id
    this.register = register
    this.full_time = full_time
  }

  /**
   * Inserts this professor in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Professor_UniversityCtor>>('professor_university').insert({
      user_id: this.user_id,
      course_id: this.course_id,
      campus_id: this.campus_id,
      university_id: this.university_id,
      register: this.register,
      full_time: this.full_time
    })
  }

  /**
   * Updates this professor in the database.
   */
  protected async _update(transaction?: Knex.Transaction) {
    const txn = transaction || db

    const professor_up = { register: this.register, full_time: this.full_time }

    await txn<Required<Professor_UniversityCtor>>('professor_university')
      .update(professor_up)
      .where({ user_id: this.user_id, university_id: this.university_id, campus_id: this.campus_id, course_id: this.course_id })
  }

  /**
   * Delets this professor in the database.
   */
  protected async _delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Professor_UniversityCtor>>('professor_university')
      .del()
      .where({ user_id: this.user_id, university_id: this.university_id, campus_id: this.campus_id, course_id: this.course_id })
  }

  /**
   * returns an professor if it`s registered in the database.
   */
  protected static async _find(filter: Professor_UniversityFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<Professor_UniversityCtor>>('professor_university').where(builder => {
      let key: keyof Professor_UniversityFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface Professor_University {
  user_id: Foreign
  course_id: Foreign
  campus_id: Foreign
  university_id: Foreign
  register: number
  full_time: boolean
}

type Professor_UniversityUp = Partial<Omit<Professor_University, 'user_id' | 'university_id'>>

const Professor_UniversityModel = new Model<Professor_University, Professor_UniversityUp>('professor_university', {
  foreign: ['user_id', 'university_id', 'campus_id', 'course_id']
})

type IProfessor_UniversityModel = IModel<Professor_University, Professor_UniversityUp>

export { Professor_UniversityModel, IProfessor_UniversityModel }
