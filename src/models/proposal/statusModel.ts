import db from '../../database'
import { Transaction } from 'knex'

export default class Status {
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
    async id(name: string, transaction?: Transaction) {
      const trx = transaction || db
      const id = await trx('status')
        .select('id_status')
        .where({ name })
        .then(row => row[0] ? row[0].id_status : null)

      return id
    }
  }
}