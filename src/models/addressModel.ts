import { Transaction } from 'knex'
import db from '../database'

export interface AddressObj {
  city: string
  address: string
  zip_code: string
}

export default class Address {
  city: string
  address: string
  zip_code: string

  /**
   * Create an address.
   */
  constructor({ city, address, zip_code }: AddressObj) {
    this.city = city
    this.address = address
    this.zip_code = zip_code
  }

  async insert(transaction: Transaction) {
    const trx = transaction || await db.transaction()

    const hasAddress = await Address.exist(this.address)

    if (hasAddress) return hasAddress

    const city_id = await trx('city')
      .select('id_city')
      .where({ city: this.city })
      .then(row => row[0].id_city)

    const addressID = await trx('address')
      .insert({ address: this.address, zip_code: this.zip_code, city_id })
      .then(row => row[0])

    await trx.commit()

    return addressID
  }

  update = {
  }

  static async delete() {
  }

  static async exist(address: string) {
    const address_id = await db('address')
      .select('id_address')
      .where({ address })
      .then(row => row[0] ? row[0].id_address : null)
    return address_id
  }
}