import forgetMail from '../services/nodemailer/forgetPassword'
import Address, { ArisAddress } from './addressModel'
import ArisError from './arisErrorModel'
import jwt from 'jsonwebtoken'
import db from '../database'
import argon from 'argon2'


export interface ArisUser {
  name: string
  sur_name: string
  phone: string
  email: string
  password: string
  role: string
}

export default class User extends Address {
  name: string
  sur_name: string
  phone?: string
  email: string
  password: string
  role: string
  /**
   * Create an user.
   */

  constructor(user: ArisUser, address: ArisAddress) {
    super(address)
    this.name = user.name
    this.sur_name = user.sur_name
    this.phone = user.phone
    this.email = user.email
    this.password = user.password
    this.role = user.role
  }

  /**
   * Inserts the user in the database.
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const hasUser = await User.exist(this.email)

    if (hasUser) throw new ArisError('User already exists', 400)


    const trx = await db.transaction()

    const address_id = await super.insert(trx)

    const role_id = await trx('role')
      .select('id_role')
      .where({ title: this.role })
      .then(row => row[0] ? row[0].id_role : null)
    if (!role_id) {
      trx.destroy()
      throw new ArisError(`Role provided does't exists!`, 400)
    }

    const hash = await argon.hash(this.password)

    const user_id = await trx('user').insert({
      name: this.name,
      sur_name: this.sur_name,
      email: this.email,
      password: hash,
      phone: this.phone,
      active: true,
      created_at: date,
      updated_at: date,
      address_id
    }).then(row => row[0])

    await trx('role_user').insert({ role_id, user_id })

    await trx.commit()


    return user_id
  }

  static update = {
    async password(id_user: number, password: string) {
      await db('user').update({ password }).where({ id_user })
    },
  }

  static async delete() {

  }

  static async login(email: string, password: string) {
    const user = await db('user_view')
      .select('id', 'password', 'role')
      .where({ email })
      .then(row => row[0] ? row[0] : null)

    if (!user)
      throw new ArisError('User don`t exists', 403)

    if (!await argon.verify(`${user.password}`, `${password}`))
      throw new ArisError('Wrong password', 403)

    const access_token = User.generateAccessToken(user.id, user.role)

    return { access_token }
  }

  static async forgotPassword(email: string) {
    const id = await User.exist(email)

    if (!id)
      throw new ArisError('User don`t exist!', 403)

    const ResetPasswordToken = jwt.sign({ id }, <string>process.env.JWT_RESET_SECRET, { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return { ResetPasswordToken } // have to pop this up later
  }

  static async resetPassword(token: string, password: string) {

    const id = <any>jwt.verify(token, <string>process.env.JWT_RESET_SECRET, (err, decoded) => {
      if (err) return err
      return (<any>decoded).id
    })

    if (typeof id === 'object')
      throw new ArisError(id.expiredAt ? 'Token expired!' : 'Invalid token signature!', 401)

    const hash = await argon.hash(password)

    await User.update.password(<number>id, hash)

    return { id, hash }
  }

  static async exist(email: string) {
    const user_id = await db('user')
      .select('id_user')
      .where({ email })
      .then(row => row[0] ? row[0].id_user : null)
    return user_id
  }

  static generateAccessToken(id: number, role: string) {
    const payload = { id, role }

    return jwt.sign(payload, <string>process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '24h' })
  }

}