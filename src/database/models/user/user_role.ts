import { Pagination } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'
import { Knex } from 'knex'
import db from '../..'

export interface User_RoleFilters {
  user_id?: number | number[]
  role_id?: number | number[]
}

export interface User_RoleCtor {
  user_id: number
  role_id: number
}

export default class User_Role1 {
  protected user_id: number
  protected role_id: number

  /**
   * Creates a role.
   */
  protected constructor({ user_id, role_id }: User_RoleCtor) {
    this.user_id = user_id
    this.role_id = role_id
  }

  protected async n_insert(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<User_RoleCtor>>('user_role').insert({ user_id: this.user_id, role_id: this.role_id })
  }

  protected async n_update(new_role_id: number, transaction?: Knex.Transaction) {
    const txn = transaction || db

    const user_role_up = { role_id: new_role_id }

    await txn<Required<User_RoleCtor>>('user_role').update(user_role_up).where({ user_id: this.user_id, role_id: this.role_id })
  }

  protected async n_delete(transaction?: Knex.Transaction) {
    const txn = transaction || db

    await txn<Required<User_RoleCtor>>('user_role').del().where({ user_id: this.user_id, role_id: this.role_id })
  }

  protected static async n_find(filter: User_RoleFilters, pagination?: Pagination) {
    const page: number = pagination?.page || 1,
      per_page: number = pagination?.per_page || 50

    const base_query = db<Required<User_RoleCtor>>('user_role').where(builder => {
      let key: keyof User_RoleFilters
      for (key in filter)
        if (filter[key]) Array.isArray(filter[key]) ? builder.whereIn(key, <any[]>filter[key]) : builder.where({ [key]: filter[key] })
    })

    if (pagination) base_query.offset((page - 1) * per_page).limit(per_page)

    return await base_query
  }

  protected static async n_update(user_id: number, old_role_id:number, new_role_id: number, transaction?: Knex.Transaction) {
    const txn = transaction || db

    const user_role_up = { role_id: new_role_id }

    await txn<Required<User_RoleCtor>>('user_role').update(user_role_up).where({ user_id, role_id: old_role_id })
  }
}

// --------------- //

// interface User_Role {
//   user_id: Foreign
//   role_id: Foreign
// }

// type User_RoleUp = Omit<User_Role, 'user_id'>

// const User_RoleModel = new Model<User_Role, User_RoleUp>('user_role', { foreign: [ 'user_id', 'role_id'] })

// type IUser_RoleModel = IModel<User_Role, User_RoleUp>

// export { User_RoleModel, IUser_RoleModel }
