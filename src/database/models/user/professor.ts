import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface ProfessorFilters {
  ids?: number[]
  full_time?: boolean
  postgraduated?: boolean
  lattes?: string[]
}

export interface ProfessorCtor {
  user_id: number
  full_time: boolean
  postgraduated: boolean
  lattes?: string
}

export default class Professor {
  user_id: number
  full_time: boolean
  postgraduated: boolean
  lattes?: string

  /**
   * Creates an professor.
   */
  constructor({ user_id, full_time, postgraduated, lattes }: ProfessorCtor) {
    this.user_id = user_id
    this.full_time = full_time
    this.postgraduated = postgraduated
    this.lattes = lattes
  }

  /**
   * Inserts this professor in the database, if doesn't already registered.
   */
  async insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn('professor').insert({
      user_id: this.user_id,
      full_time: this.full_time,
      postgraduated: this.postgraduated,
      lattes: this.lattes
    })
  }

  /**
   * Updates this professor in the database.
   */
  async update(transaction?: Transaction) {
    const txn = transaction || db

    const professor_up: Partial<this> = { ...this }
    delete professor_up.user_id

    await txn('professor').update(professor_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this professor in the database.
   */
  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('professor').del().where({ user_id: this.user_id })
  }

  /**
   * returns an professor if it`s registered in the database.
   */
  static async get(user_id: number) {
    const professor_info = await db('professor')
      .where({ user_id })
      .then(row => (row[0] ? row[0] : null))
    if (!professor_info) throw new ArisError('Professor info not found!', 400)

    return new Professor(professor_info)
  }

  /**
   * Select (with a filter or not) professor.
   */
  static async getAll(filters: ProfessorFilters, page: number) {
    const professors = await db<ProfessorCtor>('professor')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('user_id', filters.ids)
        if (filters.full_time) builder.where({ full_time: filters.full_time })
        if (filters.postgraduated) builder.where({ postgraduated: filters.postgraduated })
        if (filters.lattes && filters.lattes[0]) builder.whereIn('lattes', filters.lattes)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!professors) throw new ArisError('Didn´t find any professor!', 400)

    return professors.map(professor => new Professor(professor))
  }
}
