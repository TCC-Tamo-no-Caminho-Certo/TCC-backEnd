import User_Role, { User_RoleCtor } from './user_role'
import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

type StatusTypes = 'accepted' | 'rejected' | 'awaiting'

export interface RoleReqFilters {
  request_id?: number[] | number
  user_id?: number[] | number
  role_id?: number[] | number
  status?: StatusTypes[] | StatusTypes
  created_at?: [string, string]
  updated_at?: [string, string]
}

export interface RoleReqCtor extends User_RoleCtor {
  request_id?: number
  data?: string
  feedback?: string
  status?: StatusTypes
  created_at?: string
  updated_at?: string
}

export default class RoleReq extends User_Role {
  protected request_id: number
  protected data?: string
  protected feedback?: string
  protected status: StatusTypes
  protected created_at: string
  protected updated_at: string

  /**
   * Creates a role request.
   */
  protected constructor({ request_id, user_id, role_id, data, feedback, status, created_at, updated_at }: RoleReqCtor) {
    super({ user_id, role_id })
    this.request_id = request_id || 0 //Gives a temporary id when creating a new request
    this.data = data
    this.feedback = feedback
    this.status = status || 'awaiting'
    this.created_at = created_at || ''
    this.updated_at = updated_at || ''
  }

  /**
   * Inserts this role request in the database.
   */
  protected async _insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn('role_request').insert({ user_id: this.user_id, role_id: this.role_id, data: this.data, status: this.status })
  }

  /**
   * Updates this role request in the database.
   */
  protected async _update(transaction?: Transaction) {
    const txn = transaction || db

    const request_up = { data: this.data, feedback: this.feedback, status: this.status }

    await txn('role_request').update(request_up).where({ request_id: this.request_id })
  }

  /**
   * Deletes this role request in the database.
   */
  protected async _delete(transaction?: Transaction) {
    const txn = transaction || db

    return await txn('role_request').del().where({ request_id: this.request_id })
  }

  /**
   * Checks if an request already exists on the database.
   */
  protected static async _exist(user_id: number, role_id: number) {
    const result = await db('role_request')
      .select('request_id')
      .where({ user_id, role_id })
      .then(row => (row[0] ? true : false))
    return result
  }

  /**
   * Select (with a filter or not) role requests.
   */
  protected static async _get(filter: RoleReqFilters, pagination: Pagination = { page: 1, per_page: 50 }) {
    const { page, per_page = 50 } = pagination
    if (per_page > 100) throw new ArisError('Maximum limt per page exceeded!', 400)

    const base_query = db<Required<RoleReqCtor>>('role_request').where(builder => {
      let key: keyof RoleReqFilters
      for (key in filter) {
        if (key === 'created_at' || key === 'updated_at') builder.whereBetween(key, <[string, string]>filter[key])
        Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
      }
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)
    base_query.then(row => (row[0] ? row : null))

    const request_info = await base_query
    if (!request_info) throw new ArisError('No request found!', 400)

    return request_info
  }
}
