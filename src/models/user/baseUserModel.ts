import forgetMail from '../../services/nodemailer/forgetPassword'
import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import db from '../../database'
import Role from './roleModel'
import jwt from 'jsonwebtoken'
import argon from 'argon2'

export interface UpdateBaseUserObj {
  name?: string
  sur_name?: string
}

export interface ArisBaseUser {
  id_user?: number
  name: string
  sur_name: string
  email: string
  birthday: string
  password: string
}

export default class BaseUser {
  id_user: number
  name: string
  sur_name: string
  email: string
  birthday: string
  password: string
  role: string
  created_at?: string
  updated_at?: string

  /**
   * Creates a base user.
   */
  constructor({ id_user, name, sur_name, email, birthday, password }: ArisBaseUser) {
    this.id_user = id_user ? id_user : 0 //Gives a temporary id when creating a new user
    this.name = name
    this.sur_name = sur_name
    this.email = email
    this.birthday = birthday
    this.password = password
    this.role = 'base user'
  }

  /**
   * Inserts the user in the database.
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
        sur_name: this.sur_name,
        email: this.email,
        birthday: this.birthday,
        password: this.password,
        active: true,
        created_at: date,
        updated_at: date
      })
      .then(row => row[0])
    this.id_user = user_id

    await trx('role_user').insert({ role_id: role.id_role, user_id })

    await trx.commit()
  }

  async update({ name, sur_name }: UpdateBaseUserObj, transaction?: Transaction) {
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
    if (sur_name) {
      update_list.sur_name = sur_name
      this.sur_name = sur_name
      update++
    }

    if (update)
      await trx('user')
        .update({ ...update_list, updated_at: this.updated_at })
        .where({ id_user: this.id_user })
  }

  async delete() {}

  async login(password_provided: string) {
    if (!(await argon.verify(`${this.password}`, `${password_provided}`))) throw new ArisError('Wrong password', 403)

    const access_token = this.generateAccessToken()

    return access_token
  }

  generateAccessToken() {
    const payload = { id: this.id_user, role: this.role }

    return jwt.sign(payload, <string>process.env.JWT_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: '24h'
    })
  }

  static async forgotPassword(email: string) {
    const id = await BaseUser.exist(email)
    if (!id) throw new ArisError('User don`t exist!', 403)

    const ResetPasswordToken = jwt.sign({ id }, <string>process.env.JWT_RESET_SECRET, { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return ResetPasswordToken // have to pop this up later
  }

  static async resetPassword(token: string, password: string) {
    const id_user = <any>jwt.verify(token, <string>process.env.JWT_RESET_SECRET, (err, decoded) => {
      if (err) return err
      return (<any>decoded).id
    })

    if (typeof id_user === 'object') throw new ArisError(id_user.expiredAt ? 'Token expired!' : 'Invalid token signature!', 401)

    const hash = await argon.hash(password)

    await db('user').update({ password: hash }).where({ id_user })

    return { id: id_user, hash }
  }

  static async exist(email: string) {
    const user_id: number = await db('user')
      .select('id_user')
      .where({ email })
      .then(row => (row[0] ? row[0].id_user : null))
    return user_id
  }
}
