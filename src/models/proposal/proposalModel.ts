import ArisError from '../arisErrorModel'
import Category from './categoryModel'
import Artefact from './artefactModel'
import Status from './statusModel'
import { Transaction } from 'knex'
import db from '../../database'
import Data from '../dataModel'

interface Filters {
  ids?: number[]
  users?: number[]
  titles?: string[]
  created_at?: string[]
  updated_at?: string[]
  status?: string[]
  categories?: string[]
}

export interface ArisProposal {
  id_proposal?: number
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
}

export default class Proposal {
  id_proposal: number
  title: string
  version: number
  status: string
  categories: string[]
  user_id: number

  /**
   * Creates a proposal.
   */
  constructor({ id_proposal, title, version, status, categories, user_id }: ArisProposal) {
    this.id_proposal = id_proposal ? id_proposal : 0 //Gives a temporary id when creating a new proposal
    this.title = title
    this.version = version
    this.status = status
    this.categories = categories
    this.user_id = user_id
  }

  private _update = {
    async titleAndVersion(id_proposal: number, title: string, version: number, transaction?: Transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal')
        .update(title && version ? { title, version, updated_at: date } : title ? { title, updated_at: date } : { version, updated_at: date })
        .where({ id_proposal })
    },

    async time(id_proposal: number, transaction?: Transaction) {
      const trx = transaction || db
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await trx('proposal').update({ updated_at: date }).where({ id_proposal })
    }
  }

  /**
   * Inserts the proposal in the database.
   */
  async insert() {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const trx = await db.transaction()

    const proposal_id = await trx('proposal')
      .insert({
        title: this.title,
        version: this.version,
        created_at: date,
        updated_at: date
      })
      .then(row => row[0])

    const status_id = await Status.get.id(this.status, trx)
    if (!status_id) {
      trx.rollback()
      throw new ArisError('Status does`t exists!', 400)
    }

    const categories_ids = await Category.get.ids(this.categories, trx)
    if (categories_ids.length !== this.categories.length) {
      trx.rollback()
      throw new ArisError(`A category provided does't exists!`, 400)
    }

    await trx('status_proposal').insert({ status_id, proposal_id })
    await trx('category_proposal').insert(
      categories_ids.map(category_id => {
        return { category_id, proposal_id }
      })
    )
    await trx('user_proposal').insert({
      user_id: this.user_id,
      proposal_id,
      permission: 'owner'
    })

    await trx.commit()

    this.id_proposal = proposal_id
  }

  /**
   * Updates a proposal.
   */
  async update({ title, version, status, categories }: UpdateProposalObj) {
    if (!(await this.isOwner())) throw new ArisError('Not the owner of the proposal!', 400)

    const trx = await db.transaction()

    title || version ? await this._update.titleAndVersion(this.id_proposal, title, version, trx) : await this._update.time(this.id_proposal, trx)

    if (status) {
      const status_id = await Status.get.id(status)

      if (!status_id) {
        await trx.rollback()
        throw new ArisError('Status does`t exists!', 400)
      }

      await trx('status_proposal').update({ status_id }).where({ proposal_id: this.id_proposal })
    }

    if (categories) {
      const categories_id = await Category.get.ids(categories)

      if (categories_id.length !== categories.length) {
        await trx.rollback()
        throw new ArisError(`A category provided does't exists!`, 400)
      }

      await trx('category_proposal').del().where({ proposal_id: this.id_proposal })

      for (let i in categories_id)
        await trx('category_proposal').insert({
          category_id: categories_id[i],
          proposal_id: this.id_proposal
        })
    }

    await trx.commit()
  }

  /**
   * Deletes a proposal.
   */
  async delete() {
    if (!(await this.isOwner())) throw new ArisError('Not the owner of the proposal!', 400)

    const trx = await db.transaction()

    await trx('artefact').del().where({ proposal_id: this.id_proposal })
    await trx('user_proposal').del().where({ proposal_id: this.id_proposal })
    await trx('status_proposal').del().where({ proposal_id: this.id_proposal })
    await trx('category_proposal').del().where({ proposal_id: this.id_proposal })
    await trx('proposal').del().where({ id_proposal: this.id_proposal })

    await trx.commit()
  }

  /**
   * Check if is the owner of the proposal.
   */
  async isOwner() {
    const owner = await db('user_proposal').select('user_id', 'permission').where({ proposal_id: this.id_proposal })

    if (!owner.some(user => user.user_id === this.user_id && user.permission === 'owner')) return false

    return true
  }

  static get = {
    /**
     * Select (with a filter or not) the proposals ids.
     */
    async ids(filters: Filters, page: number) {
      const ids = await db('proposal_view')
        .select('id_proposal')
        .distinct('id_proposal')
        .where(builder => {
          filters.ids && filters.ids[0] ? builder.whereIn('id_proposal', filters.ids) : null
          filters.users && filters.users[0] ? builder.whereIn('user_id', filters.users) : null
          filters.titles && filters.titles[0] ? builder.whereIn('title', filters.titles) : null
          filters.status && filters.status[0] ? builder.whereIn('status_name', filters.status) : null
          filters.created_at && filters.created_at[0] ? builder.whereIn('created_at', filters.created_at) : null
          filters.updated_at && filters.updated_at[0] ? builder.whereIn('updated_at', filters.updated_at) : null
          filters.categories && filters.categories[0] ? builder.whereIn('category_name', filters.categories) : null
        })
        .offset((page - 1) * 5)
        .limit(5)
        .then(row => row.map(prop => prop.id_proposal))
      if (ids.length === 0) return 'Didn´t find any proposal'

      return await db('proposal_view').select('*').whereIn('id_proposal', ids)
    }
  }

  static async getProposal(user_id: number, id_proposal: number) {
    const proposal_info = await db('proposal_view')
      .where({ id_proposal })
      .then(row => (row[0] ? row : null))
    if (!proposal_info) throw new ArisError('Proposal not found!', 400)
    const result = Data.processing(proposal_info)[0]
    const proposal: ArisProposal = {
      id_proposal: result.id_proposal,
      title: result.title,
      version: result.version,
      status: result.status.name,
      categories: result.categories.map(category => category.name),
      user_id
    }
    return new Proposal(proposal)
  }
}
