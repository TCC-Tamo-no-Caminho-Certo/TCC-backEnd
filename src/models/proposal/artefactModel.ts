import db from '../../database'

export default class Artefact {
  constructor() {
  }

  // async insert() {

  // }

  update = {
    
  }

  static async delete(proposal_id: number) {
    await db('artefact').del().where({ proposal_id })
  }

  static async exist() {

  }

  get = {
    
  }
}