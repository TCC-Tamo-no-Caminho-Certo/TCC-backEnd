import db from '../../database'
import { Transaction } from 'knex'

export default class Category {
  constructor() {
  }

  async insert() {

  }

  update = {
  }

  static async delete() {

  }

  static async exist() {

  }

  static get = {
    async ids(categories: string[], transaction?: Transaction) {
      const trx = transaction || db
      const ids = await trx('category')
        .select('id_category')
        .whereIn('name', categories)
        .then(row => row.map(value => value.id_category))

      return ids
    }
  }
}