import ArisError from '../../../utils/arisError'
import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface UniversityFilters {
  university_id?: number | number[]
  name?: string | string[]
}

export interface UniversityCtor {
  university_id?: number
  name: string
  professor_regex: string
  student_regex: string
}

export default class University {
  protected university_id: number
  protected name: string
  protected professor_regex: string
  protected student_regex: string

  protected constructor({ university_id, name, professor_regex, student_regex }: UniversityCtor) {
    this.university_id = university_id || 0 //Gives a temporary id when creating a new university
    this.name = name
    this.professor_regex = professor_regex
    this.student_regex = student_regex
  }

  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    this.university_id = await txn<Required<UniversityCtor>>('university')
      .insert({ name: this.name, professor_regex: this.professor_regex, student_regex: this.student_regex })
      .then(row => row[0])
  }

  /**
   * Updates this university in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const university_up = { name: this.name, professor_regex: this.professor_regex, student_regex: this.student_regex }

    await txn<Required<UniversityCtor>>('university').update(university_up).where({ university_id: this.university_id })
  }

  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<UniversityCtor>>('university').del().where({ university_id: this.university_id })
  }

  protected static async _find(filter: UniversityFilters, pagination?: Pagination) {
    let page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50
    if (page <= 0) throw new ArisError('Invalid page value', 400)
    if (per_page > 100) throw new ArisError('Maximum limt per page exceeded!', 400)

    const base_query = db<Required<UniversityCtor>>('university').where(builder => {
      let key: keyof UniversityFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
