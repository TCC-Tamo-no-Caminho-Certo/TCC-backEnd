import forgetMail from '../services/nodemailer/forgetPassword'
import Address, { ArisAddress } from './addressModel'
import ArisError from './arisErrorModel'
import jwt from 'jsonwebtoken'
import db from '../database'
import argon from 'argon2'


export interface ArisUser extends ArisAddress {
  id_user?: number
  name: string
  sur_name: string
  phone?: string
  email: string
  password: string
  role: string
}

export default class User extends Address {
  id_user: number
  name: string
  sur_name: string
  phone?: string
  email: string
  password: string
  role: string
  created_at?: string
  updated_at?: string
  /**
   * Create an user.
   */

  constructor({ id_user, name, sur_name, email, password, role, phone, address, city, zip_code }: ArisUser) {
    super({ address, city, zip_code })
    this.id_user = id_user ? id_user : 0 //Gives a temporary id when creating a new user
    this.name = name
    this.sur_name = sur_name
    this.phone = phone
    this.email = email
    this.password = password
    this.role = role
  }

  /**
   * Inserts the user in the database.
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.created_at = date
    this.updated_at = date

    const hasUser = await User.exist(this.email)
    if (hasUser) throw new ArisError('User already exists', 400)


    const trx = await db.transaction()

    await super.insert(trx)

    const role_id = await trx('role')
      .select('id_role')
      .where({ title: this.role })
      .then(row => row[0] ? row[0].id_role : null)
    if (!role_id) {
      trx.destroy()
      throw new ArisError(`Role provided does't exists!`, 400)
    }

    const hash = await argon.hash(this.password)
    this.password = hash

    const user_id = await trx('user').insert({
      name: this.name,
      sur_name: this.sur_name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      active: true,
      created_at: date,
      updated_at: date,
      address_id: this.id_address
    }).then(row => row[0])

    await trx('role_user').insert({ role_id, user_id })

    await trx.commit()


    this.id_user = user_id
  }

  async login(password_provided: string) {

    if (!await argon.verify(`${this.password}`, `${password_provided}`))
      throw new ArisError('Wrong password', 403)

    const access_token = this.generateAccessToken()

    return access_token
  }

  static update() {
  }

  async delete() {

  }

  generateAccessToken() {
    const payload = { id: this.id_user, role: this.role }

    return jwt.sign(payload, <string>process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '24h' })
  }

  static async forgotPassword(email: string) {
    const id = await User.exist(email)

    if (!id)
      throw new ArisError('User don`t exist!', 403)

    const ResetPasswordToken = jwt.sign({ id }, <string>process.env.JWT_RESET_SECRET, { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return ResetPasswordToken // have to pop this up later
  }

  static async resetPassword(token: string, password: string) {

    const id_user = <any>jwt.verify(token, <string>process.env.JWT_RESET_SECRET, (err, decoded) => {
      if (err) return err
      return (<any>decoded).id
    })

    if (typeof id_user === 'object')
      throw new ArisError(id_user.expiredAt ? 'Token expired!' : 'Invalid token signature!', 401)

    const hash = await argon.hash(password)

    await db('user').update({ password: hash }).where({ id_user })

    return { id: id_user, hash }
  }

  static async exist(email: string) {
    const user_id: number = await db('user')
      .select('id_user')
      .where({ email })
      .then(row => row[0] ? row[0].id_user : null)
    return user_id
  }

  static async getUser(email: string) {
    const user_info: ArisUser = await db('user_view').select().where({ email }).then(row => row[0] ? row[0] : null)
    if (!user_info) throw new ArisError('User don`t exists!', 403)
    return new User(user_info)
  }

}