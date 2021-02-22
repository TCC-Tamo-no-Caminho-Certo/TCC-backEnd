import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface EmailFilters {
  email_id?: number | number[]
  user_id?: number | number[]
  address?: string | string[]
  main?: boolean
}

export interface EmailCtor {
  email_id?: number
  user_id: number
  address: string
  main?: boolean
  options?: { [key: string]: any }
}

export default class Email {
  protected email_id: number
  protected user_id: number
  protected address: string
  protected main: boolean
  protected options: { [key: string]: any }

  protected constructor({ email_id, user_id, address, main, options }: EmailCtor) {
    this.email_id = email_id || 0 //Gives a temporary id when creating a new email
    this.user_id = user_id
    this.address = address
    this.main = main || false
    this.options = options || {}
  }

  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    this.email_id = await txn('email')
      .insert({ user_id: this.user_id, address: this.address, main: this.main, options: this.options })
      .then(row => row[0])
  }

  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const email_up = { address: this.address, main: this.main, options: this.options }

    await txn('email').update(email_up).where({ email_id: this.email_id })
  }

  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn('email').del().where({ email_id: this.email_id })
  }

  protected static async _exist(address: string) {
    const result = await db<Required<EmailCtor>>('email')
      .where({ address })
      .then(row => (row[0] ? true : false))
    return result
  }

  protected static async _get(filter: EmailFilters) {
    const email_info = await db<Required<EmailCtor>>('email')
      .where(builder => {
        let key: keyof EmailFilters
        for (key in filter) {
          Array.isArray(filter[key]) ? builder.whereIn(<string>key, <Array<any>>filter[key]) : builder.where({ [key]: filter[key] })
        }
      })
      .then(row => (row[0] ? row : null))
    if (!email_info) throw new ArisError('No email found!', 400)

    return email_info
  }

  protected static async _getAll(filters: EmailFilters, pagination: { page: number; limit?: number } = { page: 1, limit: 50 }) {
    const { page, limit = 50 } = pagination
    const emails_info = await db<Required<EmailCtor>>('email')
      .where(builder => {
        let key: keyof EmailFilters
        for (key in filters) {
          Array.isArray(filters[key]) ? builder.whereIn(<string>key, <any[]>filters[key]) : builder.where({ [key]: filters[key] })
        }
        // if (filters.email_id) builder.whereIn('email_id', filters.email_id)
        // if (filters.user_id) builder.whereIn('user_id', filters.user_id)
        // if (filters.address) builder.whereIn('address', filters.address)
        // if (filters.main) builder.where({ main: filters.main })
      })
      .offset((page - 1) * limit)
      .limit(limit)
      .then(row => (row[0] ? row : null))
    if (!emails_info) throw new ArisError('Didn´t find any email!', 400)

    return emails_info
  }
}
