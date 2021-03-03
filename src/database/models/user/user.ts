import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface UserFilters {
  user_id?: number | number[]
  phone?: string | string[]
  birthday?: string | string[]
  created_at?: [string, string]
  updated_at?: [string, string]
}

export interface UserCtor {
  user_id?: number
  name: string
  surname: string
  full_name?: string
  phone?: string
  birthday: string
  password: string
  avatar_uuid?: string
  created_at?: string
  updated_at?: string
}

export default class User {
  protected user_id: number
  protected name: string
  protected surname: string
  protected full_name: string
  protected phone?: string
  protected birthday: string
  protected password: string
  protected avatar_uuid: string
  protected created_at: string
  protected updated_at: string

  /**
   * Creates an user.
   */
  protected constructor({ user_id, name, surname, full_name, avatar_uuid, birthday, password, phone, created_at, updated_at }: UserCtor) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.full_name = full_name || `${name} ${surname}`
    this.phone = phone
    this.birthday = birthday
    this.password = password
    this.avatar_uuid = avatar_uuid || 'default'
    this.created_at = created_at || ''
    this.updated_at = updated_at || ''
  }

  /**
   * Inserts this user in the database, if doesn't already registered.
   * @param User.password - needs to be hashed!
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    this.user_id = await txn<Required<UserCtor> & { active: boolean }>('user')
      .insert({
        name: this.name,
        surname: this.surname,
        birthday: this.birthday,
        password: this.password,
        active: true
      })
      .then(row => row[0])
  }

  /**
   * Updates this user in the database.
   * @param User.password - needs to be hashed!
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const user_up = {
      name: this.name,
      surname: this.surname,
      phone: this.phone,
      birthday: this.birthday,
      password: this.password,
      avatar_uuid: this.avatar_uuid
    }

    await txn<Required<UserCtor>>('user').update(user_up).where({ user_id: this.user_id })
    this.updated_at = new Date().toUTCString()
  }

  /**
   * Delets this user in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<UserCtor>>('user').del().where({ user_id: this.user_id })
  }

  /**
   * Select with a filter users.
   */
  protected static async _find(filter: UserFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<UserCtor>>('user').where(builder => {
      let key: keyof UserFilters
      for (key in filter) {
        if ((key === 'created_at' || key === 'updated_at') && filter[key]) builder.whereBetween(key, <[string, string]>filter[key])
        else if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
      }
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
