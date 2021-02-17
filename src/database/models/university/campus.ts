import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface CampusFilters {
  ids?: number[]
  university_ids?: number[]
  name?: string[]
}

export interface CampusCtor {
  campus_id?: number
  university_id: number
  name: string
}

export default class Campus {
  campus_id: number
  university_id: number
  name: string

  constructor({ campus_id, university_id, name }: CampusCtor) {
    this.campus_id = campus_id || 0 //Gives a temporary id when creating a new campus
    this.university_id = university_id
    this.name = name
  }

  async insert(transaction?: Transaction) {
    const txn = transaction || db

    this.campus_id = await txn('campus')
      .insert({ university_id: this.university_id, name: this.name })
      .then(row => row[0])
  }

  /**
   * Updates this campus in the database.
   */
  async update(transaction?: Transaction) {
    const txn = transaction || db

    const campus_up: Partial<this> = { ...this }
    delete campus_up.campus_id
    delete campus_up.university_id

    await txn('campus').update(campus_up).where({ campus_id: this.campus_id })
  }

  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('campus').del().where({ campus_id: this.campus_id })
  }

  static async get(campus_id: number) {
    const campus_info = await db('user')
      .where({ campus_id })
      .then(row => (row[0] ? row[0] : null))
    if (!campus_info) throw new ArisError('Campus not found!', 400)

    return new Campus(campus_info)
  }

  static async getAll(filters: CampusFilters, page: number) {
    const campus = await db<CampusCtor>('campus')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('campus_id', filters.ids)
        if (filters.university_ids && filters.university_ids[0]) builder.whereIn('university_id', filters.university_ids)
        if (filters.name) builder.where('name', 'like', `%${filters.name}%`)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!campus) throw new ArisError('Didn´t find any campus!', 400)

    return campus.map(camp => new Campus(camp))
  }

  static async getUniversityCampus(university_id: number) {
    const campus = await db('campus')
      .where({ university_id })
      .then(row => (row[0] ? row : null))
    if (!campus) throw new ArisError('Couldn`t find universities campus!', 500)

    return campus.map(camp => new Campus(camp))
  }

  static async getUniversitiesCampus(university_ids: number[]) {
    const campus = await db('campus')
      .whereIn('university_id', university_ids)
      .then(row => (row[0] ? row : null))
    if (!campus) throw new ArisError('Couldn`t find universities campus!', 500)

    return campus.map(camp => new Campus(camp))
  }
}
