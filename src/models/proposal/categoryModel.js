const Data = require('../../models/dataModel')
const db = require('../../database')

module.exports = class Category extends Data {
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
    async ids(categories, proposal_id, transaction) {
      const trx = transaction || db
      const ids = await trx('category')
        .select('id_category')
        .whereIn('name', categories)
        .then(row => proposal_id ? row.map(value => {return {category_id: value.id_category, proposal_id}}) : row.map(value => value.id_category))

      return ids
    }
  }
}