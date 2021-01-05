import ArisError from '../../utils/arisError'
import Data from '../../utils/data'
import db from '../../database'

type StatusTypes = 'accepted' | 'rejected' | 'awaiting'

interface Filters {
  ids?: number[]
  users_ids?: number[]
  roles_ids?: number[]
  status?: StatusTypes[]
  created_at?: [string, string]
  updated_at?: [string, string]
}

interface UpdateAddRoleObj {
  data?: string
  status?: StatusTypes
}

interface ArisAddRole {
  request_id?: number
  user_id: number
  role_id: number
  data: string
  status: StatusTypes
  created_at?: string
  updated_at?: string
}

export default class RoleReq {
  request_id: number
  user_id: number
  role_id: number
  data: string
  status: StatusTypes
  created_at?: string
  updated_at?: string

  constructor({ request_id, user_id, role_id, data, status }: ArisAddRole) {
    this.request_id = request_id || 0 //Gives a temporary id when creating a new request
    this.user_id = user_id
    this.role_id = role_id
    this.data = data
    this.status = status
  }

  async insert() {
    return await db('role_request').insert({ user_id: this.user_id, role_id: this.role_id, data: this.data, status: this.status })
  }

  async update({ data, status }: UpdateAddRoleObj) {
    let update_count = 0
    const update_list: any = {}

    if (data) {
      update_list.data = data
      this.data = data
      update_count++
    }
    if (status) {
      update_list.status = status
      this.status = status
      update_count++
    }

    update_count && (await db('role_request').update(update_list).where({ request_id: this.request_id }))
  }

  async delete() {
    return await db('role_request').del().where({ request_id: this.request_id })
  }

  static async getAllRequests(filters: Filters, page: number) {
    const result = await db('role_request')
      .where(builder => {
        filters.ids && filters.ids[0] ? builder.whereIn('request_id', filters.ids) : null
        filters.users_ids && filters.users_ids[0] ? builder.whereIn('user_id', filters.users_ids) : null
        filters.roles_ids && filters.roles_ids[0] ? builder.whereIn('role_id', filters.roles_ids) : null
        filters.status && filters.status[0] ? builder.whereIn('status', filters.status) : null
        filters.created_at && filters.created_at[0] ? builder.whereBetween('created_at', filters.created_at) : null
        filters.updated_at && filters.updated_at[0] ? builder.whereBetween('updated_at', filters.updated_at) : null
      })
      .offset((page - 1) * 5)
      .limit(5)
      .then(row => row.map(request => Data.parseDatetime(request)))

    return result
  }

  static async getRequest(request_id: number) {
    const request_info = await db('role_request')
      .where({ request_id })
      .then(row => (row[0] ? Data.parseDatetime(row[0]) : null))
    if (!request_info) throw new ArisError('Request not found!', 403)

    return new RoleReq(request_info)
  }
}
