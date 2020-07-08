const db = require('../../database')
const Status = require('./statusModel')
const Category = require('./categoryModel')
const Artefact = require('./artefactModel')

module.exports = class Proposal extends Artefact {
  /**
   * Create a proposal.
   * @param {Object} info
   * @param {!string} info.title
   * @param {!number} info.version
   * @param {!string} info.status
   * @param {!string[]} info.categories
   * @param {!number} info.userID
   */
  constructor({ title, version, status, categories, userID }) {
    super()
    this.title = title
    this.version = version
    this.status = status
    this.categories = categories
    this.userID = userID
  }

  /**
   * Inserts the proposal in the database.
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const trx = await db.transaction()


    const proposal_id = await trx('proposal').insert({
      title: this.title,
      version: this.version,
      created_at: date,
      updated_at: date
    }).then(row => row[0])

    const status_id = await Status.get.id(this.status, trx)
    if (!status_id) {
      trx.rollback()
      return { Error: 'Status does`t exists!' }
    }

    const categories_ids = await Category.get.ids(this.categories, proposal_id, trx)
    if (categories_ids.length !== this.categories.length) {
      trx.rollback()
      return { Error: `A category provided does't exists!` }
    }

    await trx('status_proposal').insert({ status_id, proposal_id })
    await trx('category_proposal').insert(categories_ids)
    await trx('user_proposal').insert({ user_id: this.userID, proposal_id, permission: 0 })


    await trx.commit()

    return proposal_id
  }

  static update = {
    async titleAndVersion(id_proposal, title, version, transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal')
        .update((title && version) ? { title, version, updated_at: date } : title ? { title, updated_at: date } : { version, updated_at: date })
        .where({ id_proposal })
    },

    async time(id_proposal, transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal')
        .update({ updated_at: date })
        .where({ id_proposal })
    }
  }

  /**
 * Updates a proposal.
 * @param {Object} update
 * @param {?string} update.title - The title of the proposal.
 * @param {?number} update.version - The proposal's version.
 * @param {?string} update.status - The proposal's status.
 * @param {?string[]} update.categories - The proposal's categories.
 * @param {!number} update.proposal_id - The proposal's id.
 */
  static async updateAll({ title, version, status, categories, proposal_id }) {
    const trx = await db.transaction()

    title || version ?
      await Proposal.update.titleAndVersion(proposal_id, title, version, trx) :
      await Proposal.update.time(proposal_id, trx)


    if (status) {
      const status_id = await Status.get.id(status)

      if (!status_id) {
        await trx.rollback()
        return { Error: 'Status does`t exists!' }
      }

      await trx('status_proposal').update({ status_id }).where({ proposal_id })
    }


    if (categories) {
      const categoriesID = await Category.get.ids(categories)

      if (categoriesID.length !== categories.length) {
        await trx.rollback()
        return { Error: `A category provided does't exists!` }
      }

      await trx('category_proposal').del().where({ proposal_id })

      for (let i in categoriesID) await trx('category_proposal').insert({ category_id: categoriesID[i], proposal_id })
    }

    await trx.commit()
    return true
  }

  /**
   * Deletes a proposal.
   * @param {!number} id_proposal 
   */
  static async delete(id_proposal) {
    await super.delete(id_proposal)
    await db('user_proposal').del().where({ proposal_id: id_proposal })
    await db('status_proposal').del().where({ proposal_id: id_proposal })
    await db('category_proposal').del().where({ proposal_id: id_proposal })
    await db('proposal').del().where({ id_proposal })
  }

  static get = {
    /**
     * @typedef filter
     * @property {?number[]} ids proposals ids
     * @property {?number[]} users ids of the users in the proposal
     * @property {?string[]} titles proposals titles
     * @property {?string[]} created_at criation date of proposals
     * @property {?string[]} updated_at updation date of proposals
     * @property {?string[]} status_name proposals status
     * @property {?string[]} categories_name proposals categories
     */
    /**
     * Select (with a filter or not) the proposals ids.
     * @param {filter} filter 
     * @param {number} [page=1] 
     */
    async ids(filter, page) {
      const ids = await db('proposal_view').distinct('id')
        .where(builder => {
          filter.ids ? builder.whereIn('id', filter.ids) : null
          filter.users ? builder.whereIn('users', filter.users) : null
          filter.titles ? builder.whereIn('title', filter.titles) : null
          filter.created_at ? builder.whereIn('created_at', filter.created_at) : null
          filter.updated_at ? builder.whereIn('updated_at', filter.updated_at) : null
          filter.status_name ? builder.whereIn('status_name', filter.status_name) : null
          filter.categories_name ? builder.whereIn('category_name', filter.categories_name) : null
        })
        .offset((page - 1) * 5)
        .limit(5)
        .then(row => row.map(prop => prop.id))
      if (ids.length === 0) return { list: 'Didn´t find any proposal' }

      return await db('proposal_view').select('*').whereIn('id', ids)
    }
  }

  /**
   * Check if is the owner of the proposal.
   * @param {!number} user_id
   * @param {!number} proposal_id
   */
  static async isOwner(user_id, proposal_id) {
    const owner = await db('user_proposal').select('user_id').where({ proposal_id }).then(row => row[0] ? row : null)

    if (!owner || !owner.some(id => id.user_id === user_id)) return false

    return true
  }
}