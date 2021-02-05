import Email, { ArisEmail } from './emailModel'
import Role, { RoleTypes } from './roleModel'
import { Transaction } from 'knex'
import db from '../../database'

export interface ArisBaseUser {
  user_id?: number
  name: string
  surname: string
  emails?: Email[]
  avatar?: string
  birthday: string
  password: string
  created_at?: string
  updated_at?: string
}
// cant have more than one main email create a check!
export default class BaseUser {
  user_id: number
  name: string
  surname: string
  emails: Email[]
  avatar: string
  birthday: string
  password: string
  roles: RoleTypes[]
  created_at?: string
  updated_at?: string

  /**
   * Creates a base user.
   */
  constructor({ user_id, name, surname, emails, avatar, birthday, password, created_at, updated_at }: ArisBaseUser) {
    this.user_id = user_id || 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.emails = emails || []
    this.avatar = avatar || 'default'
    this.birthday = birthday
    this.password = password
    this.roles = ['guest']
    this.created_at = created_at
    this.updated_at = updated_at
  }

  /**
   * Inserts this user in the database, if doesn't already registered.
   * @param User.password - needs to be hashed!
   */
  async insert() {
    const trx = await db.transaction()

    const role = await Role.getRole(this.roles[0], trx)

    this.user_id = await trx('user')
      .insert({
        name: this.name,
        surname: this.surname,
        birthday: this.birthday,
        password: this.password,
        active: true
      })
      .then(row => row[0])

    await role.linkWithUser(this.user_id, trx)

    await trx.commit()
  }

  /**
   * Updates this user in the database.
   * @param User.password - needs to be hashed!
   */
  async update(transaction?: Transaction) {
    const trx = transaction || db

    const user_up: Partial<this> = { ...this }
    delete user_up.user_id
    delete user_up.emails
    delete user_up.roles
    delete user_up.created_at
    delete user_up.updated_at

    await trx('user').update(user_up).where({ user_id: this.user_id })

    this.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }

  /**
   * Delets this user in the database.
   */
  async delete() {
    await db('user').del().where({ user_id: this.user_id })
  }

  /**
   * Checks if an user is already registered, and returns its id if so.
   */
  static async exist(email: string) {
    const user_id: number | boolean = await db('email')
      .select('user_id')
      .where({ email })
      .then(row => (row[0] ? row[0].user_id : false))
    return user_id
  }

  // EMAIL

  async addEmail({ address, main, options }: ArisEmail) {
    const email = new Email({ address, main, options })
    await email.insert(this.user_id)
    this.emails.push(email)
  }
}
