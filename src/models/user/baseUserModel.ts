import Role, { RoleTypes } from './roleModel'
import ArisError from '../../utils/arisError'
import { Transaction } from 'knex'
import db from '../../database'

export interface UpdateBaseUserObj {
  [key: string]: any
  name?: string
  surname?: string
  birthday?: string
  avatar?: string
  password?: string
}

export interface ArisBaseUser {
  user_id?: number
  name: string
  surname: string
  email: string
  avatar: string
  birthday: string
  password: string
  created_at?: string
  updated_at?: string
}

export default class BaseUser {
  [key: string]: any
  user_id: number
  name: string
  surname: string
  email: string
  avatar: string
  birthday: string
  password: string
  role: RoleTypes
  created_at?: string
  updated_at?: string

  /**
   * Creates a base user.
   */
  constructor({ user_id, name, surname, email, avatar, birthday, password, created_at, updated_at }: ArisBaseUser) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.email = email
    this.avatar = avatar || 'default'
    this.birthday = birthday
    this.password = password
    this.role = 'base user'
    this.created_at = created_at
    this.updated_at = updated_at
  }

  /**
   * Inserts this user in the database, if doesn't already registered.
   * @param User.password - needs to be hashed!
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.created_at = date
    this.updated_at = date

    const hasUser = await BaseUser.exist(this.email)
    if (hasUser) throw new ArisError('User already exists', 400)

    const trx = await db.transaction()

    const role = await Role.getRole(this.role, trx)

    const user_id = await trx('user')
      .insert({
        name: this.name,
        surname: this.surname,
        email: this.email,
        birthday: this.birthday,
        password: this.password,
        active: true,
        created_at: date,
        updated_at: date
      })
      .then(row => row[0])
    this.user_id = user_id

    await trx('role_user').insert({ role_id: role.role_id, user_id })

    await trx.commit()
  }

  /**
   * Updates this user in the database.
   * @param update.password - needs to be hashed!
   */
  async update(update: UpdateBaseUserObj, transaction?: Transaction) {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.updated_at = date

    const trx = transaction || db

    let update_count = 0
    const update_list: UpdateBaseUserObj = {}

    for (const key in update) {
      update_list[key] = update[key]
      this[key] = update[key]
      update_count++
    }

    update_count &&
      (await trx('user')
        .update({ ...update_list, updated_at: this.updated_at })
        .where({ user_id: this.user_id }))
  }

  /**
   * Delets this user in the database.
   */
  async delete(transaction?: Transaction) {
    const trx = transaction || db

    await trx('role_user').del().where({ user_id: this.user_id })
    await trx('user').del().where({ user_id: this.user_id })
  }

  /**
   * Checks if an user (email) is already registered, and returns its id if so.
   */
  static async exist(email: string) {
    const user_id: number = await db('user')
      .select('user_id')
      .where({ email })
      .then(row => (row[0] ? row[0].user_id : null))
    return user_id
  }
}
