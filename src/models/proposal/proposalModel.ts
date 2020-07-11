import db from '../../database'
import { Transaction } from 'knex'
import Status from './statusModel'
import Category from './categoryModel'
import Artefact from './artefactModel'

interface Filters {
  ids?: number[]
  users?: number[]
  titles?: string[]
  created_at?: string[]
  updated_at?: string[]
  status?: string[]
  categories?: string[]
}

export interface ProposalObj {
  title: string
  version: number
  status: string
  categories: string[]
  user_id: number
}

export interface UpdateProposalObj {
  title: string
  version: number
  status: string
  categories: string[]
  proposal_id: number
}

export default class Proposal extends Artefact {
  title: string
  version: number
  status: string
  categories: string[]
  user_id: number
  /**
   * Create a proposal.
   */
  constructor({ title, version, status, categories, user_id }: ProposalObj) {
    super()
    this.title = title
    this.version = version
    this.status = status
    this.categories = categories
    this.user_id = user_id
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
      return <any>{ Error: 'Status does`t exists!' }
    }

    const categories_ids = await Category.get.ids(this.categories, trx)
    if (categories_ids.length !== this.categories.length) {
      trx.rollback()
      return <any>{ Error: `A category provided does't exists!` }
    }

    await trx('status_proposal').insert({ status_id, proposal_id })
    await trx('category_proposal').insert(categories_ids.map(category_id => { return { category_id, proposal_id } }))
    await trx('user_proposal').insert({ user_id: this.user_id, proposal_id, permission: 0 })


    await trx.commit()

    return proposal_id
  }

  static update = {
    async titleAndVersion(id_proposal: number, title: string, version: number, transaction?: Transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal')
        .update((title && version) ? { title, version, updated_at: date } : title ? { title, updated_at: date } : { version, updated_at: date })
        .where({ id_proposal })
    },

    async time(id_proposal: number, transaction?: Transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal')
        .update({ updated_at: date })
        .where({ id_proposal })
    }
  }

  /**
 * Updates a proposal.
 */
  static async updateAll({ title, version, status, categories, proposal_id }: UpdateProposalObj) {
    const trx = await db.transaction()

    title || version ?
      await Proposal.update.titleAndVersion(proposal_id, title, version, trx) :
      await Proposal.update.time(proposal_id, trx)


    if (status) {
      const status_id = await Status.get.id(status)

      if (!status_id) {
        await trx.rollback()
        return <any>{ Error: 'Status does`t exists!' }
      }

      await trx('status_proposal').update({ status_id }).where({ proposal_id })
    }


    if (categories) {
      const categories_id = await Category.get.ids(categories)

      if (categories_id.length !== categories.length) {
        await trx.rollback()
        return <any>{ Error: `A category provided does't exists!` }
      }

      await trx('category_proposal').del().where({ proposal_id })

      for (let i in categories_id) await trx('category_proposal').insert({ category_id: categories_id[i], proposal_id })
    }

    await trx.commit()
    return true
  }

  /**
   * Deletes a proposal.
   */
  static async delete(id_proposal: number) {
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
     * @property {?string[]} status proposals status
     * @property {?string[]} categories proposals categories
     */
    /**
     * Select (with a filter or not) the proposals ids.
     * @param {filter} filters
     * @param {number} [page=1] 
     */
    async ids(filters: Filters, page: number = 1) {
      const ids = await db('proposal_view').distinct('id')
        .where(builder => {
          filters.ids ? builder.whereIn('id', filters.ids) : null
          filters.users ? builder.whereIn('users', filters.users) : null
          filters.titles ? builder.whereIn('title', filters.titles) : null
          filters.created_at ? builder.whereIn('created_at', filters.created_at) : null
          filters.updated_at ? builder.whereIn('updated_at', filters.updated_at) : null
          filters.status ? builder.whereIn('status_name', filters.status) : null
          filters.categories ? builder.whereIn('category_name', filters.categories) : null
        })
        .offset((page - 1) * 5)
        .limit(5)
        .then(row => row.map(prop => prop.id))
      if (ids.length === 0) return 'Didn´t find any proposal'

      return await db('proposal_view').select('*').whereIn('id', ids)
    }
  }

  /**
   * Check if is the owner of the proposal.
   */
  static async isOwner(user_id: number, proposal_id: number) {
    const owner = await db('user_proposal').select('user_id').where({ proposal_id }).then(row => row[0] ? row : null)

    if (!owner || !owner.some(id => id.user_id === user_id)) return false

    return true
  }
}