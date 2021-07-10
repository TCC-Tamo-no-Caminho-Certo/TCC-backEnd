import { Pagination } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface Student_UniversityFilters {
  user_id?: number | number[]
  course_id?: number | number[]
  campus_id?: number | number[]
  university_id?: number | number[]
  register?: number | number[]
  semester?: number | number[]
}

export interface Student_UniversityCtor {
  user_id: number
  course_id: number
  campus_id: number
  university_id: number
  register: number
  semester: number
}

export default class Student_University1 {
  protected user_id: number
  protected course_id: number
  protected campus_id: number
  protected university_id: number
  protected register: number
  protected semester: number

  /**
   * Creates an student.
   */
  protected constructor({ user_id, course_id, campus_id, university_id, register, semester }: Student_UniversityCtor) {
    this.user_id = user_id
    this.course_id = course_id
    this.campus_id = campus_id
    this.university_id = university_id
    this.register = register
    this.semester = semester
  }

  /**
   * Inserts this student in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Student_UniversityCtor>>('student_university').insert({
      user_id: this.user_id,
      course_id: this.course_id,
      campus_id: this.campus_id,
      university_id: this.university_id,
      register: this.register,
      semester: this.semester
    })
  }

  /**
   * Updates this student in the database.
   */
  protected async _update(transaction?: Knex.Transaction) {
    const txn = transaction || db

    const student_up = { register: this.register, semester: this.semester }

    await txn<Required<Student_UniversityCtor>>('student_university')
      .update(student_up)
      .where({ user_id: this.user_id, university_id: this.university_id, campus_id: this.campus_id, course_id: this.course_id })
  }

  /**
   * Delets this student in the database.
   */
  protected async _delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Student_UniversityCtor>>('student_university')
      .del()
      .where({ user_id: this.user_id, university_id: this.university_id, campus_id: this.campus_id, course_id: this.course_id })
  }

  /**
   * returns an student if it`s registered in the database.
   */
  protected static async _find(filter: Student_UniversityFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<Student_UniversityCtor>>('student_university').where(builder => {
      let key: keyof Student_UniversityFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface Student_University {
  user_id: Foreign
  course_id: Foreign
  campus_id: Foreign
  university_id: Foreign
  register: number
  semester: number
}

type Student_UniversityUp = Partial<Omit<Student_University, 'user_id' | 'university_id'>>

const Student_UniversityModel = new Model<Student_University, Student_UniversityUp>('student_university', {
  foreign: ['user_id', 'university_id', 'campus_id', 'course_id']
})

type IStudent_UniversityModel = IModel<Student_University, Student_UniversityUp>

export { Student_UniversityModel, IStudent_UniversityModel }
