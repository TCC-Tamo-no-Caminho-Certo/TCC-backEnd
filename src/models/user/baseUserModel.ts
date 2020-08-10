import forgetMail from '../../services/nodemailer/forgetPassword'
import Role, { RoleTypes } from './roleModel'
import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import config from '../../config'
import db from '../../database'
import jwt from 'jsonwebtoken'
import argon from 'argon2'

export interface UpdateBaseUserObj {
  name?: string
  surname?: string
}

export interface ArisBaseUser {
  user_id?: number
  name: string
  surname: string
  email: string
  birthday: string
  password: string
  created_at?: string
  updated_at?: string
}

export default class BaseUser {
  user_id: number
  name: string
  surname: string
  email: string
  birthday: string
  password: string
  role: RoleTypes
  created_at?: string
  updated_at?: string

  /**
   * Creates a base user.
   */
  constructor({ user_id, name, surname, email, birthday, password, created_at, updated_at }: ArisBaseUser) {
    this.user_id = user_id ? user_id : 0 //Gives a temporary id when creating a new user
    this.name = name
    this.surname = surname
    this.email = email
    this.birthday = birthday
    this.password = password
    this.role = 'base user'
    this.created_at = created_at
    this.updated_at = updated_at
  }

  /**
   * Inserts this user in the database.
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.created_at = date
    this.updated_at = date

    const hasUser = await BaseUser.exist(this.email)
    if (hasUser) throw new ArisError('User already exists', 400)

    const trx = await db.transaction()

    const role = await Role.getRole(this.role, trx)

    const hash = await argon.hash(this.password)
    this.password = hash

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
   */
  async update({ name, surname }: UpdateBaseUserObj, transaction?: Transaction) {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.updated_at = date

    const trx = transaction || db

    let update = 0
    const update_list: UpdateBaseUserObj = {}
    if (name) {
      update_list.name = name
      this.name = name
      update++
    }
    if (surname) {
      update_list.surname = surname
      this.surname = surname
      update++
    }

    if (update)
      await trx('user')
        .update({ ...update_list, updated_at: this.updated_at })
        .where({ user_id: this.user_id })
  }

  /**
   * Delets this user in the database.
   */
  async delete(transaction?: Transaction) {
    const trx = transaction || db
    await trx('user').del().where({ user_id: this.user_id })
  }

  /**
   * Sends an email for the user with a link to reset his password.
   */
  static async forgotPassword(email: string) {
    const id = await BaseUser.exist(email)
    if (!id) throw new ArisError('User don`t exist!', 403)

    const ResetPasswordToken = jwt.sign({ id }, config.jwt.resetSecret, { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return ResetPasswordToken // have to pop this up later
  }

  /**
   * Updates the user`s password in the database.
   */
  static async resetPassword(token: string, password: string) {
    const user_id = jwt.verify(token, config.jwt.resetSecret, (err, decoded) => {
      if (err) throw new ArisError(err.name === 'TokenExpiredError' ? 'Token expired!' : 'Invalid token signature!', 401)
      return (<any>decoded).id
    })

    const hash = await argon.hash(password)

    await db('user').update({ password: hash }).where({ user_id })

    return { id: user_id, hash }
  }

  /**
   * Checks if an user (email) is already registered.
   */
  static async exist(email: string) {
    const user_id: number = await db('user')
      .select('user_id')
      .where({ email })
      .then(row => (row[0] ? row[0].user_id : null))
    return user_id
  }
}
