import { Model, Increment, Foreign, IModel } from '..'
import User_Role, { User_RoleCtor } from './user_role'
import { Knex } from 'knex'
import db from '../..'

import { Pagination, RoleTypes } from '../../../@types/types'

type RoleRequestStatus = 'accepted' | 'rejected' | 'awaiting'

export interface RoleReqFilters {
  request_id?: number[] | number
  user_id?: number[] | number
  role_id?: number[] | number
  data?: { [key: string]: any }
  status?: RoleRequestStatus[] | RoleRequestStatus
  created_at?: [string, string]
  updated_at?: [string, string]
}

export interface RoleReqCtor extends User_RoleCtor {
  request_id?: number
  data?: { [key: string]: any }
  voucher_uuid?: string
  feedback?: string
  status?: RoleRequestStatus
  created_at?: string
  updated_at?: string
}

export default class Role_Request extends User_Role {
  protected request_id: number
  protected data?: { [key: string]: any }
  protected voucher_uuid?: string
  protected feedback?: string
  protected status: RoleRequestStatus
  protected created_at: string
  protected updated_at: string

  /**
   * Creates a role request.
   */
  protected constructor({ request_id, user_id, role_id, data, voucher_uuid, feedback, status, created_at, updated_at }: RoleReqCtor) {
    super({ user_id, role_id })
    this.request_id = request_id || 0 //Gives a temporary id when creating a new request
    this.data = data
    this.voucher_uuid = voucher_uuid
    this.feedback = feedback
    this.status = status || 'awaiting'
    this.created_at = created_at || ''
    this.updated_at = updated_at || ''
  }

  /**
   * Inserts this role request in the database.
   */
  protected async _insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    this.request_id = await txn('role_request')
      .insert({
        user_id: this.user_id,
        role_id: this.role_id,
        data: JSON.stringify(this.data),
        voucher_uuid: this.voucher_uuid,
        status: this.status
      })
      .then(row => row[0])
  }

  /**
   * Updates this role request in the database.
   */
  protected async _update(transaction?: Knex.Transaction) {
    const txn = transaction || db

    const request_up = { voucher_uuid: this.voucher_uuid, data: JSON.stringify(this.data), feedback: this.feedback, status: this.status }

    await txn('role_request').update(request_up).where({ request_id: this.request_id })
    this.updated_at = new Date().toUTCString()
  }

  /**
   * Deletes this role request in the database.
   */
  protected async _delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    return await txn('role_request').del().where({ request_id: this.request_id })
  }

  /**
   * Select (with a filter or not) role requests.
   */
  protected static async _find(filter: RoleReqFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<RoleReqCtor>>('role_request').where(builder => {
      let key: keyof RoleReqFilters
      for (key in filter) {
        if (filter[key]) {
          if (key === 'created_at' || key === 'updated_at') builder.whereBetween(key, <[string, string]>filter[key])
          else if (typeof filter[key] === 'object')
            for (const data_key in <any>filter[key])
              builder.whereRaw(
                `data->'$.${data_key}' ${
                  Array.isArray((<any>filter[key])[data_key])
                    ? `in (${
                        typeof (<any>filter[key])[data_key][0] === 'string'
                          ? (<any>filter[key])[data_key].map((value: string) => `'${value}'`)
                          : (<any>filter[key])[data_key]
                      })`
                    : `= ${typeof (<any>filter[key])[data_key] === 'string' ? `'${(<any>filter[key])[data_key]}'` : (<any>filter[key])[data_key]}`
                } `
              )
          else Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
        }
      }
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }
}

// --------------- //

interface RoleRequest {
  id: Increment
  user_id: Foreign
  role: RoleTypes
  data: { [key: string]: any } | null
  voucher_uuid: string | null
  feedback: string | null
  status: RoleRequestStatus
  created_at: string
  updated_at: string
}

const RoleRequestModel = new Model<RoleRequest>('role_request', { increment: 'id', foreign: ['user_id'] })

type IRoleRequestModel = IModel<RoleRequest>

export { RoleRequestModel, IRoleRequestModel }
