const Data = require('../../models/dataModel')
const db = require('../../database')

module.exports = class Status extends Data {
  constructor() {
    super()
  }

  async insert() {

  }

  static update() {
    return {

    }
  }

  static async delete() {

  }

  static async exist() {

  }

  static get = {
    async id(name, transaction) {
      const trx = transaction || db
      const id = await trx('status')
        .select('id_status')
        .where({ name })
        .then(row => row[0] ? row[0].id_status : null)

      return id
    }
  }
}