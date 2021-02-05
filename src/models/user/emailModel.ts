import ArisError from '../../utils/arisError'
import { Transaction } from 'knex'
import db from '../../database'

export interface ArisEmail {
  email_id?: number
  address: string
  main?: boolean
  options?: { [key: string]: any }
}

export default class Email {
  email_id: number
  address: string
  main?: boolean
  options?: { [key: string]: any }

  constructor({ email_id, address, main = false, options }: ArisEmail) {
    this.email_id = email_id || 0 //Gives a temporary id when creating a new email
    this.address = address
    this.main = main
    this.options = options
  }

  async insert(user_id: number, transaction?: Transaction) {
    const trx = transaction || db

    const hasEmail = await Email.exist(this.address)
    if (hasEmail) {
      transaction && transaction.rollback()
      throw new ArisError('Email already registered!', 400)
    }

    this.email_id = await trx('email')
      .insert({ user_id, address: this.address, main: this.main })
      .then(row => row[0])
  }

  async update() {}

  async delete() {
    await db('email').del().where({ email_id: this.email_id })
  }

  static async exist(address: string) {
    const result: boolean = await db<Email>('email')
      .where({ address })
      .then(row => (row[0] ? true : false))
    return result
  }

  static async getEmail(address: string) {
    const email_info = await db('email')
      .where({ address })
      .then(row => (row[0] ? row[0] : null))
    if (!email_info) throw new ArisError('Email not found!', 400)

    return new Email(email_info)
  }

  static async getAllEmails() {}
}
