const Data = require('../../models/dataModel')
const db = require('../../database')

module.exports = class Artefact extends Data {
  constructor() {
    super()
  }

  async insert() {

  }

  static update() {
    return {

    }
  }

  static async delete(proposal_id) {
    await db('artefact').del().where({ proposal_id })
  }

  static async exist() {

  }

  static get() {
    return {

    }
  }
}