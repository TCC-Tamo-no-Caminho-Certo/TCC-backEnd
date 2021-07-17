import { Pagination } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface Moderator_UniversityFilters {
  user_id?: number | number[]
  university_id?: number | number[]
}

export interface Moderator_UniversityCtor {
  user_id: number
  university_id: number
}

export default class Moderator_University1 {
  protected user_id: number
  protected university_id: number

  /**
   * Creates an Moderator.
   */
  protected constructor({ user_id, university_id }: Moderator_UniversityCtor) {
    this.user_id = user_id
    this.university_id = university_id
  }

  /**
   * Inserts this Moderator in the database, if doesn't already registered.
   */
  protected async _insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Moderator_UniversityCtor>>('moderator_university').insert({
      user_id: this.user_id,
      university_id: this.university_id
    })
  }

  /**
   * Updates this Moderator in the database.
   */
  protected async _update(transaction?: Knex.Transaction) {
    const txn = transaction || db

    const moderator_up = {}

    await txn<Required<Moderator_UniversityCtor>>('moderator_university')
      .update(moderator_up)
      .where({ user_id: this.user_id, university_id: this.university_id })
  }

  /**
   * Deletes this Moderator in the database.
   */
  protected async _delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<Moderator_UniversityCtor>>('moderator_university').del().where({ user_id: this.user_id, university_id: this.university_id })
  }

  /**
   * returns an Moderator if it`s registered in the database.
   */
  protected static async _find(filter: Moderator_UniversityFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<Moderator_UniversityCtor>>('moderator_university').where(builder => {
      let key: keyof Moderator_UniversityFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface Moderator_University {
  user_id: Foreign
  university_id: Foreign
}

const Moderator_UniversityModel = new Model<Moderator_University, never>('moderator_university', { foreign: ['user_id', 'university_id'] })

type IModerator_UniversityModel = IModel<Moderator_University, never>

export { Moderator_UniversityModel, IModerator_UniversityModel }
