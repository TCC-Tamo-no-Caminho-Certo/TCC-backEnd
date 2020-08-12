import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import db from '../../database'

export interface ArisAddress {
  address_id?: number
  city: string
  address: string
  postal_code: string
}

export default class Address {
  address_id: number
  city: string
  address: string
  postal_code: string

  /**
   * Create an address.
   */
  constructor({ address_id, city, address, postal_code }: ArisAddress) {
    this.address_id = address_id ? address_id : 0
    this.city = city
    this.address = address
    this.postal_code = postal_code
  }

  /**
   * Inserts this address on the database.
   */
  async insert(transaction?: Transaction) {
    const trx = transaction || (await db.transaction())

    const hasAddress = await Address.exist(this.city, this.address, this.postal_code)

    if (hasAddress) {
      this.address_id = hasAddress
      return
    }

    const city_id = await trx('city')
      .select('city_id')
      .where({ name: this.city })
      .then(row => row[0].city_id)

    const id = await trx('address')
      .insert({ address: this.address, postal_code: this.postal_code, city_id })
      .then(row => row[0])

    transaction || (await trx.commit())

    this.address_id = id
  }

  /**
   * Delets this address in the database.
   */
  async delete() {
    await db('address').del().where({ address_id: this.address_id })
  }

  /**
   * Checks if an address is already registered in the database.
   */
  static async exist(city: string, address: string, postal_code: string) {
    const address_id: number = await db('address_view')
      .select('address_id')
      .where({ city, address, postal_code })
      .then(row => (row[0] ? row[0].address_id : null))
    return address_id
  }

  /**
   * returns an address if it`s registered in the database.
   */
  static async getAddress(address_id: number) {
    const address_info = await db('address_view')
      .where({ address_id })
      .then(row => (row[0] ? row[0] : null))
    if (!address_info) throw new ArisError('Address not found!', 403)
    return new Address(address_info)
  }
}
