const db = require('../database')
const Data = require('./dataModel')


module.exports = class Address extends Data {
  constructor({ city, address, zip_code }) {
    super()
    this.city = city
    this.address = address
    this.zip_code = zip_code
  }

  async insert(transaction) {
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

    transaction ? null : await trx.commit()

    return addressID
  }

  static async update() {
  }

  static async delete() {
  }

  static async exist(address) {
    const addressID = await db('address')
      .select('id_address')
      .where({ address })
      .then(row => row[0] ? row[0].id_address : null)
    return addressID
  }
}