import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface StudentFilters {
  user_id?: number | number[]
  ar?: number | number[]
  semester?: number | number[]
}

export interface StudentCtor {
  user_id: number
  ar: number
  semester: number
}

export default class Student {
  protected user_id: number
  protected ar: number
  protected semester: number

  /**
   * Creates an student.
   */
  protected constructor({ user_id, ar, semester }: StudentCtor) {
    this.user_id = user_id
    this.ar = ar
    this.semester = semester
  }

  /**
   * Inserts this student in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<StudentCtor>>('student').insert({
      user_id: this.user_id,
      ar: this.ar,
      semester: this.semester
    })
  }

  /**
   * Updates this student in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const student_up = { user_id: this.user_id, ar: this.ar, semester: this.semester }

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
  protected static async _get(filter: StudentFilters) {
    const student_info = await db<Required<StudentCtor>>('student')
      .where(builder => {
        let key: keyof StudentFilters
        for (key in filter) {
          Array.isArray(filter[key]) ? builder.whereIn(<string>key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
        }
      })
      .then(row => (row[0] ? row : null))
    if (!student_info) throw new ArisError('Student info not found!', 400)

    return student_info
  }
}
