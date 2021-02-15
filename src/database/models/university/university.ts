import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface UniversityFilters {
  ids?: number[]
  name?: string[]
}

export interface UniversityCtor {
  university_id?: number
  name: string
  professor_regex: string
  student_regex: string
}

export default class University {
  university_id: number
  name: string
  professor_regex: RegExp
  student_regex: RegExp

  constructor({ university_id, name, professor_regex, student_regex }: UniversityCtor) {
    this.university_id = university_id || 0 //Gives a temporary id when creating a new university
    this.name = name
    this.professor_regex = new RegExp(professor_regex)
    this.student_regex = new RegExp(student_regex)
  }

  async insert(transaction?: Transaction) {
    const txn = transaction || db

    this.university_id = await txn('university')
      .insert({ name: this.name, professor_regex: this.professor_regex, student_regex: this.student_regex })
      .then(row => row[0])
  }

  /**
   * Updates this university in the database.
   */
  async update(transaction?: Transaction) {
    const txn = transaction || db

    const university_up: Partial<this> = { ...this }
    delete university_up.university_id

    await txn('university').update(university_up).where({ university_id: this.university_id })
  }

  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('university').del().where({ university_id: this.university_id })
  }

  static async get(university_id: number, transaction?: Transaction) {
    const txn = transaction || db

    const university_info = await txn('university')
      .where({ university_id })
      .then(row => (row[0] ? row[0] : null))
    if (!university_info) throw new ArisError('University not found!', 400)

    return new University(university_info)
  }

  static async getAll(filters: UniversityFilters, page: number, transaction?: Transaction) {
    const txn = transaction || db

    const universities = await txn<UniversityCtor>('university')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('university_id', filters.ids)
        if (filters.name) builder.where('name', 'like', `%${filters.name}%`)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!universities) throw new ArisError('Didn´t find any university!', 400)

    return universities.map(university => new University(university))
  }
}
