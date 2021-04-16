import { Pagination } from '../../../types'
import { Transaction } from 'knex'
import db from '../..'

export interface EmailFilters {
  email_id?: number | number[]
  user_id?: number | number[]
  university_id?: number | number[]
  address?: string | string[]
  main?: boolean
}

export interface EmailCtor {
  email_id?: number
  user_id: number
  university_id?: number
  address: string
  main?: boolean
  options?: { [key: string]: any }
}

export default class Email {
  protected email_id: number
  protected user_id: number
  protected university_id?: number
  protected address: string
  protected main: boolean
  protected options: { [key: string]: any }

  protected constructor({ email_id, user_id, university_id, address, main, options }: EmailCtor) {
    this.email_id = email_id || 0 //Gives a temporary id when creating a new email
    this.user_id = user_id
    this.university_id = university_id
    this.address = address
    this.main = main || false
    this.options = options || {}
  }

  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    this.email_id = await txn('email')
      .insert({
        user_id: this.user_id,
        university_id: this.university_id,
        address: this.address,
        main: this.main,
        options: JSON.stringify(this.options)
      })
      .then(row => row[0])
  }

  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const email_up = { address: this.address, main: this.main, university_id: this.university_id, options: this.options }

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

  protected static async _find(filter: EmailFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<EmailCtor>>('email').where(builder => {
      let key: keyof EmailFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}
