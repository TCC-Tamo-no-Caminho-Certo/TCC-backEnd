import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface CampusFilters {
  ids?: number[]
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

  async update() {}

  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('campus').del().where({ campus_id: this.campus_id })
  }

  static async get(campus_id: number, transaction?: Transaction) {
    const txn = transaction || db

    const campus_info = await txn('user')
      .where({ campus_id })
      .then(row => (row[0] ? row[0] : null))
    if (!campus_info) throw new ArisError('Campus not found!', 400)

    return new Campus(campus_info)
  }

  static async getAll(filters: CampusFilters, page: number, transaction?: Transaction) {
    const txn = transaction || db

    const campus = await txn<Omit<Campus, 'insert' | 'update' | 'delete'>>('campus')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('campus_id', filters.ids)
        if (filters.name) builder.where('name', 'like', `%${filters.name}%`)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!campus) throw new ArisError('Didn´t find any campus!', 400)

    return campus.map(camp => new Campus(camp))
  }
}
