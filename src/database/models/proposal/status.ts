import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface ArisStatus {
  status_id?: number
  name: string
  icon: string
  description: string
}

export interface UpdateStatusObj {
  name?: string
  icon?: string
  description?: string
}
export default class Status {
  status_id: number
  name: string
  icon: string
  description: string

  /**
   * Creates a status.
   */
  constructor({ status_id, name, icon, description }: ArisStatus) {
    this.status_id = status_id ? status_id : 0
    this.name = name
    this.icon = icon
    this.description = description
  }

  /**
   * Inserts this status in the database.
   */
  async insert() {
    const has_status = await Status.exist(this.name)
    if (has_status) throw new ArisError('Status already exists!', 400)

    const status_id = await db('status')
      .insert({
        name: this.name,
        icon: this.icon,
        description: this.description
      })
      .then(row => row[0])

    this.status_id = status_id
  }

  /**
   * Updates this status in the database.
   */
  async update({ name, icon, description }: UpdateStatusObj) {
    let update = 0
    const update_list: UpdateStatusObj = {}
    if (name) {
      update_list.name = name
      update++
    }
    if (icon) {
      update_list.icon = icon
      update++
    }
    if (description) {
      update_list.description = description
      update++
    }

    if (update) await db('status').update(update_list).where({ status_id: this.status_id })
  }

  /**
   * Delets this status in the database.
   */
  async delete() {
    await db('status').del().where({ status_id: this.status_id })
  }

  static get = {
    async id(name: string, transaction?: Transaction) {
      const trx = transaction || db
      const id = await trx('status')
        .select('status_id')
        .where({ name })
        .then(row => (row[0] ? row[0].status_id : null))

      return id
    },

    async allStatus() {
      const status = await db('status')
        .select()
        .then(row => (row[0] ? row : null))

      return status
    }
  }

  /**
   * Checks if an status is already registered in the database.
   */
  static async exist(name: string) {
    const has_status = await db('status')
      .where({ name })
      .then(row => (row[0] ? row[0] : null))
    return has_status ? true : false
  }

  /**
   * returns an status if it`s registered in the database.
   */
  static async getStatus(status_id: number) {
    const status_info = await db('status')
      .where({ status_id })
      .then(row => (row[0] ? row[0] : null))
    if (!status_info) throw new ArisError('Status not found!', 400)
    return new Status(status_info)
  }
}
