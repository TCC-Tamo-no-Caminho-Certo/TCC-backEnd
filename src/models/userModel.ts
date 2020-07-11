import forgetMail from '../services/nodemailer/forgetPassword'
import Address, { AddressObj } from './addressModel'
import jwt from 'jsonwebtoken'
import db from '../database'
import argon from 'argon2'

export interface UserObj {
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
  phone: string
  email: string
  password: string
  role: string
  /**
   * Create an user.
   */

  constructor(user: UserObj, address: AddressObj) {
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

    if (hasUser) return { Error: 'User already exists' }


    const trx = await db.transaction()

    const address_id = await super.insert(trx)

    const role_id = await trx('role')
      .select('id_role')
      .where({ title: this.role })
      .then(row => row[0] ? row[0].id_role : null)
    if (!role_id) {
      trx.destroy()
      return { Error: `Role provided does't exists!` }
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


    const payload = {
      id: user_id,
      role: this.role
    }

    const access_token = jwt.sign(payload, (<string>process.env.JWT_PRIVATE_KEY), { expiresIn: '24h', algorithm: 'RS256' })

    return { id: user_id, access_token }
  }

  static update = {
    async password(id_user: number, password: string) {
      await db('user').update({ password }).where({ id_user })
    },
  }

  static async delete() {

  }

  static async exist(email: string) {
    const user_id = await db('user')
      .select('id_user')
      .where({ email })
      .then(row => row[0] ? row[0].id_user : null)
    return user_id
  }

  static async login(email: string, password: string) {
    const user = await db('user')
      .innerJoin('role_user', 'user.id_user', 'role_user.user_id')
      .innerJoin('role', 'role_user.role_id', 'role.id_role')
      .select('user.id_user', 'user.password', { role: 'role.title' })
      .where({ email })
      .then(row => row[0] ? row[0] : null)

    if (!user)
      return { Error: 'User don`t exists' }

    if (!await argon.verify(`${user.password}`, `${password}`))
      return { Error: 'Wrong password' }

    const payload = {
      id: user.id_user,
      role: user.role
    }

    const access_token = jwt.sign(payload, (<string>process.env.JWT_PRIVATE_KEY), { algorithm: 'RS256', expiresIn: '24h' })


    return { access_token }
  }

  static async forgotPassword(email: string) {
    const id = await User.exist(email)

    if (!id) return { Error: 'User don`t exist!' }

    const ResetPasswordToken = jwt.sign({ id }, (<string>process.env.JWT_RESET_SECRET), { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return { ResetPasswordToken } // have to pop this up later
  }

  static async resetPassword(token: string, password: string) {

    const id = (<any>jwt.verify(token, (<string>process.env.JWT_RESET_SECRET), (err, decoded) => {
      if (err) return err
      return (<any>decoded).id
    }))

    if (typeof id === 'object')
      return id ? { Error: 'Token expired!' } : { Error: 'Invalid token signature!' }

    const hash = await argon.hash(password)

    await User.update.password((<number>id), hash)

    return { id, hash }
  }
}