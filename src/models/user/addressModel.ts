import { Transaction } from 'knex'
import db from '../../database'

export interface ArisAddress {
  id_address?: number
  city: string
  address: string
  postal_code: string
}

export default class Address {
  id_address: number
  city: string
  address: string
  postal_code: string

  /**
   * Create an address.
   */
  constructor({ id_address, city, address, postal_code }: ArisAddress) {
    this.id_address = id_address ? id_address : 0
    this.city = city
    this.address = address
    this.postal_code = postal_code
  }

  async insert(transaction?: Transaction) {
    const trx = transaction || (await db.transaction())

    const hasAddress = await Address.exist(this.address)

    if (hasAddress) {
      this.id_address = hasAddress
      return
    }

    const city_id = await trx('city')
      .select('id_city')
      .where({ name: this.city })
      .then(row => row[0].id_city)

    const id = await trx('address')
      .insert({ address: this.address, postal_code: this.postal_code, city_id })
      .then(row => row[0])

    transaction || (await trx.commit())

    this.id_address = id
  }

  update = {}

  async delete() {}

  static async exist(address: string) {
    const address_id: number = await db('address')
      .select('id_address')
      .where({ address })
      .then(row => (row[0] ? row[0].id_address : null))
    return address_id
  }
}
