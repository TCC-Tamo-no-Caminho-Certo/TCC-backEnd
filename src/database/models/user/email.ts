import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface EmailCtor {
  email_id?: number
  address: string
  main?: boolean
  options?: { [key: string]: any }
}

export default class Email {
  email_id: number
  address: string
  main?: boolean
  options?: { [key: string]: any } // SPECIFY OPTIONS

  constructor({ email_id, address, main = false, options }: EmailCtor) {
    this.email_id = email_id || 0 //Gives a temporary id when creating a new email
    this.address = address
    this.main = main
    this.options = options
  }

  async insert(user_id: number, transaction?: Transaction) {
    const txn = transaction || db

    if (await Email.exist(this.address)) {
      transaction && transaction.rollback()
      throw new ArisError('Email already registered!', 400)
    }

    this.email_id = await txn('email')
      .insert({ user_id, address: this.address, main: this.main })
      .then(row => row[0])
  }

  async update() {}

  async delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('email').del().where({ email_id: this.email_id })
  }

  static async exist(address: string) {
    const result: boolean = await db<Email>('email')
      .where({ address })
      .then(row => (row[0] ? true : false))
    return result
  }

  static async get(address: string) {
    const email_info = await db('email')
      .where({ address })
      .then(row => (row[0] ? row[0] : null))
    if (!email_info) throw new ArisError('Email not found!', 400)

    return new Email(email_info)
  }

  static async getUserEmails(user_id: number) {
    const email_info = await db('email')
      .select('email_id', 'address', 'main', 'options')
      .where({ user_id })
      .then(row => (row[0] ? row : null))
    if (!email_info) throw new ArisError('Couldn`t found user emails!', 500)
    return email_info.map(email => new Email(email))
  }

  static async getUsersEmails(user_ids: number[]): Promise<(EmailCtor & { user_id: number })[]> {
    const emails = await db('email')
      .whereIn('user_id', user_ids)
      .then(row => (row[0] ? row : null))
    if (!emails) throw new ArisError('Couldn`t found users emails!', 500)

    return emails
  }
}
