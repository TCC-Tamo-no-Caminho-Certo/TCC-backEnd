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
  phone?: string
  birthday: string
  password: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

export default class User {
  user_id: number
  name: string
  surname: string
  full_name: string
  phone?: string
  birthday: string
  password: string
  avatar: string
  created_at?: string
  updated_at?: string

  /**
   * Creates an user.
   */
  constructor({ user_id, name, surname, avatar, birthday, password, phone, created_at, updated_at }: UserCtor) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.full_name = `${name} ${surname}`
    this.phone = phone
    this.birthday = birthday
    this.password = password
    this.avatar = avatar || 'default'
    this.created_at = created_at
    this.updated_at = updated_at
  }

  /**
   * Inserts this user in the database, if doesn't already registered.
   * @param User.password - needs to be hashed!
   */
  async insert(transaction?: Transaction) {
    const txn = transaction || db

    this.user_id = await txn('user')
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
  async update(transaction?: Transaction) {
    const txn = transaction || db

    const user_up: Partial<this> = { ...this }
    delete user_up.user_id
    delete user_up.full_name
    delete user_up.created_at
    delete user_up.updated_at

    await txn('user').update(user_up).where({ user_id: this.user_id })
  }

  /**
   * Delets this user in the database.
   */
  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('user').del().where({ user_id: this.user_id })
  }

  /**
   * returns an user if it`s registered in the database.
   * @param identifier - an user id or email.
   */
  static async get(user_id: number) {
    const user_info = await db('user')
      .where({ user_id })
      .then(row => (row[0] ? row[0] : null))
    if (!user_info) throw new ArisError('User not found!', 400)

    return new User(user_info)
  }

  /**
   * Select (with a filter or not) users.
   */
  static async getAll(filters: UserFilters, page: number) {
    const users = await db<Omit<User, 'insert' | 'update' | 'delete'>>('user')
      .where(builder => {
        if (filters.ids && filters.ids[0]) builder.whereIn('user_id', filters.ids)
        if (filters.name) builder.where('full_name', 'like', `%${filters.name}%`)
        if (filters.created_at && filters.created_at[0]) builder.whereBetween('created_at', filters.created_at)
        if (filters.updated_at && filters.updated_at[0]) builder.whereBetween('updated_at', filters.updated_at)
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => (row[0] ? row : null))
    if (!users) throw new ArisError('Didn´t find any user!', 400)

    return users.map(user => new User(user))
  }
}
