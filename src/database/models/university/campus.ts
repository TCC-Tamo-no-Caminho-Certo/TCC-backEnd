import { Pagination } from '../../../@types/types'
import { Model, Increment, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface CampusFilters {
  campus_id?: number | number[]
  university_id?: number | number[]
  name?: string | string[]
}

export interface CampusCtor {
  campus_id?: number
  university_id: number
  name: string
}

export default class Campus1 {
  protected campus_id: number
  protected university_id: number
  protected name: string

  protected constructor({ campus_id, university_id, name }: CampusCtor) {
    this.campus_id = campus_id || 0 //Gives a temporary id when creating a new campus
    this.university_id = university_id
    this.name = name
  }

  protected async _insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    this.campus_id = await txn<Required<CampusCtor>>('campus')
      .insert({ university_id: this.university_id, name: this.name })
      .then(row => row[0])
  }

  /**
   * Updates this campus in the database.
   */
  protected async _update(transaction?: Knex.Transaction) {
    const txn = transaction || db

    const campus_up = { name: this.name }

    await txn<Required<CampusCtor>>('campus').update(campus_up).where({ campus_id: this.campus_id })
  }

  protected async _delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<CampusCtor>>('campus').del().where({ campus_id: this.campus_id })
  }

  protected static async _find(filter: CampusFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<CampusCtor>>('campus').where(builder => {
      let key: keyof CampusFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface Campus {
  id: Increment
  university_id: Foreign
  name: string
}

const CampusModel = new Model<Campus>('campus', { increment: 'id', foreign: ['university_id'] }, true)

type ICampusModel = IModel<Campus>

export { CampusModel, ICampusModel }
