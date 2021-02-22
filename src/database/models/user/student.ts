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
  protected static async _get(filter: StudentFilters, pagination: Pagination = { page: 1, per_page: 50 }) {
    const { page, per_page = 50 } = pagination
    if (per_page > 100) throw new ArisError('Maximum limt per page exceeded!', 400)

    const base_query = db<Required<StudentCtor>>('student').where(builder => {
      let key: keyof StudentFilters
      for (key in filter) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)
    base_query.then(row => (row[0] ? row : null))

    const student_info = await base_query
    if (!student_info) throw new ArisError('No student found!', 400)

    return student_info
  }
}
