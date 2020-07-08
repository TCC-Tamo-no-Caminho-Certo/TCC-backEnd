const forgetMail = require('../resources/nodemailer/forgetPassword')
const Address = require('./addressModel')
const jwt = require('jsonwebtoken')
const db = require('../database')
const argon = require('argon2')


module.exports = class User extends Address {
  /**
   * @typedef user
   * @property {string} name
   * @property {string} sur_name
   * @property {string} [phone]
   * @property {string} email
   * @property {string} password
   * @property {string} role
   */

  /**
   * @typedef address
   * @property {string} city
   * @property {string} address
   * @property {string} zip_code
   */

  /**
   * Create a user.
   * @param {user} user
   * @param {address} address
   */
  constructor(user = { name, sur_name, phone, email, password, role }, address = { city, address, zip_code }) {
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

    const sessionToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: '24h', algorithm: 'RS256' })

    return { id: user_id, sessionToken }
  }

  static update = {
    async password(id_user, password) {
      await db('user').update({ password }).where({ id_user })
    },
  }

  static async delete() {

  }

  static async exist(email) {
    const userID = await db('user')
      .select('id_user')
      .where({ email })
      .then(row => row[0] ? row[0].id_user : null)
    return userID
  }

  static async login(email, password) {
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

    const sessionToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '24h' })


    return sessionToken
  }

  static async forgotPassword(email) {
    const id = await User.exist(email)

    if (!id) return { Error: 'User don`t exist!' }

    const token = jwt.sign({ id }, process.env.JWT_RESET_SECRET, { expiresIn: '1h' })

    // await forgetMail({ email }, err => { if (err) { Error: 'Couldn`t send email!' } })// have to send a link with the token above

    return token // have to pop this up later
  }

  static async resetPassword(token, password) {
    const id = jwt.verify(token, process.env.JWT_RESET_SECRET, (err, decoded) => {
      if (err) return err
      return decoded.id
    })

    if (typeof id === 'object')
      return id.expiredAt ? { Error: 'Token expired!' } : { Error: 'Invalid token signature!' }


    const hash = await argon.hash(password)

    await User.update.password(id, hash)

    return { id, hash }
  }
}