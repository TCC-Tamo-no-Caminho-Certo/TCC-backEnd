import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export interface User_RoleCtor {
  user_id: number
  role_id: number
}

export default class User_Role {
  protected user_id: number
  protected role_id: number

  /**
   * Creates a role.
   */
  protected constructor({ user_id, role_id }: User_RoleCtor) {
    this.user_id = user_id
    this.role_id = role_id
  }

  protected async n_insert(transaction?: Transaction) {
    const txn = transaction || db

    await txn<User_RoleCtor>('user_role').insert({ user_id: this.user_id, role_id: this.role_id })
  }

  protected async n_update(new_role_id: number, transaction?: Transaction) {
    const txn = transaction || db

    const user_role_up = { role_id: new_role_id }

    await txn<User_RoleCtor>('user_role').update(user_role_up).where({ user_id: this.user_id, role_id: this.role_id })
  }

  protected async n_delete(transaction?: Transaction) {
    const txn = transaction || db

    await txn<User_RoleCtor>('user_role').del().where({ user_id: this.role_id, role_id: this.role_id })
  }

  protected static async n_get(user_id: number | number[]) {
    const user_role_info = await db<User_RoleCtor>('user_role')
      .where(builder => (Array.isArray(user_id) ? builder.whereIn('user_id', user_id) : builder.where({ user_id })))
      .then(row => (row[0] ? row : null))
    if (!user_role_info) throw new ArisError('Couldn`t find user role!', 500)

    return user_role_info
  }
}
