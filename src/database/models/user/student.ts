import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface StudentFilters {
  ids?: number[]
  ar?: number[]
  semester?: number[]
}

export interface StudentCtor {
  user_id: number
  ar: number
  semester: number
}

export default class Student {
  user_id: number
  ar: number
  semester: number

  /**
   * Creates an student.
   */
  constructor({ user_id, ar, semester }: StudentCtor) {
    this.user_id = user_id
    this.ar = ar
    this.semester = semester
  }

  /**
   * Inserts this student in the database, if doesn't already registered.
   */
  async insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn('student').insert({
      user_id: this.user_id,
      ar: this.ar,
      semester: this.semester
    })
  }

  /**
   * Updates this student in the database.
   */
  async update(transaction?: Transaction) {
    const txn = transaction || db

    const student_up: Partial<this> = { ...this }
    delete student_up.user_id

    await txn('student').update(student_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this student in the database.
   */
  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('student').del().where({ user_id: this.user_id })
  }

  /**
   * returns an student if it`s registered in the database.
   */
  static async get(user_id: number) {
    const student_info = await db('student')
      .where({ user_id })
      .then(row => (row[0] ? row[0] : null))
    if (!student_info) throw new ArisError('Student info not found!', 400)

    return new Student(student_info)
  }

  /**
   * Select (with a filter or not) student.
   */
  static async getAll(filters: StudentFilters, page: number) {
    const students = await db<StudentCtor>('student')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('user_id', filters.ids)
        if (filters.ar && filters.ar[0]) builder.whereIn('ar', filters.ar)
        if (filters.semester && filters.semester[0]) builder.whereIn('semester', filters.semester)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!students) throw new ArisError('Didn´t find any student!', 400)

    return students.map(student => new Student(student))
  }
}
