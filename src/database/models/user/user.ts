import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface UserFilters {
  ids?: number[]
  name?: string[]
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
  avatar?: string
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
  protected avatar: string
  protected created_at: string
  protected updated_at: string

  /**
   * Creates an user.
   */
  protected constructor({ user_id, name, surname, full_name, avatar, birthday, password, phone, created_at, updated_at }: UserCtor) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.full_name = full_name || `${name} ${surname}`
    this.phone = phone
    this.birthday = birthday
    this.password = password
    this.avatar = avatar || 'default'
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
      avatar: this.avatar
    }

    await txn<Required<UserCtor>>('user').update(user_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this user in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<Required<UserCtor>>('user').del().where({ user_id: this.user_id })
  }

  /**
   * returns an user if it`s registered in the database.
   */
  protected static async _get(user_id: number) {
    const user_info = await db<Required<UserCtor>>('user')
      .where({ user_id })
      .then(row => (row[0] ? row[0] : null))
    if (!user_info) throw new ArisError('User not found!', 400)

    return user_info
  }

  /**
   * Select (with a filter or not) users.
   */
  protected static async _getAll(filter: UserFilters, page: number) {
    const users = await db<Required<UserCtor>>('user')
      .where(builder => {
        let key: keyof UserFilters
        for (key in filter) {
          if (key === 'created_at' || key === 'updated_at') builder.whereBetween(<string>key, <[string, string]>filter[key])
          Array.isArray(filter[key]) ? builder.whereIn(<string>key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
        }
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!users) throw new ArisError('Didn´t find any user!', 400)

    return users
  }
}
