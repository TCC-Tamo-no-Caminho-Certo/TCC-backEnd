import Email, { EmailCtor, EmailFilters } from '../../database/models/user/email'
import ArisError from '../arisError'

import { Pagination } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type GetEmail = Required<EmailCtor>

export default class ArisEmail extends Email {
  private txn?: Transaction

  /**
   * Creates an new user.
   */
  static async create(email_info: Omit<EmailCtor, 'email_id'>) {
    if (await this._exist(email_info.address)) throw new ArisError('Email already registered!', 400)

    const email = new ArisEmail(email_info)
    await email._insert()

    return email
  }

  /**
   * returns a parameter of email.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetEmail>(key: T): GetEmail[T] {
    const aux_ob = { ...this.format(), user_id: this.user_id }
    return aux_ob[key]
  }

  /**
   * returns a formatted object of email infos.
   */
  format() {
    const aux_ob: Omit<GetEmail, 'user_id'> = { email_id: this.email_id, address: this.address, main: this.main, options: this.options }
    return aux_ob
  }

  /**
   * Returns an Aris email array.
   */
  static async find<T extends EmailFilters>(filter: T, pagination?: Pagination) {
    const emails_info = await this._find(filter, pagination)

    return <T extends { email_id: number } | { address: string } ? [ArisEmail] : ArisEmail[]>emails_info.map(email => new ArisEmail(email))
  }

  /**
   * Updates the email`s info.
   */
  async update({ address, main, options }: Partial<Omit<EmailCtor, 'email_id' | 'user_id'>>) {
    if (address) this.address = address
    if (main) this.main = main
    if (options) this.options = options

    await this._update(this.txn)
  }

  /**
   * Deletes this email.
   */
  async delete() {
    await this._delete(this.txn)
  }

  // -----TRANSACTION----- //

  /**
   * creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }
}
