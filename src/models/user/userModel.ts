import BaseUser, { ArisBaseUser } from './baseUserModel'
import Address, { ArisAddress } from './addressModel'
import Role, { RoleTypes } from './roleModel'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'
import { Transaction } from 'knex'
import db from '../../database'

export interface UpdateUserObj {
  [key: string]: any
  name?: string
  surname?: string
  birthday?: string
  avatar?: string
  password?: string
  phone?: string
  address_info?: ArisAddress
}

export interface ArisUser extends ArisBaseUser {
  phone?: string
  roles: RoleTypes[]
  address_id?: number
}

export default class User extends BaseUser {
  phone?: string
  address_id: number

  /**
   * Creates an user.
   */
  constructor({ user_id, name, surname, email, avatar, birthday, password, roles, phone, address_id, created_at, updated_at }: ArisUser) {
    super({ user_id, name, surname, email, avatar, birthday, password, created_at, updated_at })
    this.phone = phone
    this.roles = roles
    this.address_id = address_id || 0
  }

  /**
   * Aris User can´t be inserted.
   */
  async insert() {
    throw new Error('Aris User can´t be inserted!')
  }

  /**
   * Updates this user in the database.
   * @param update.password - needs to be hashed!
   */
  async update(update: UpdateUserObj, transaction?: Transaction) {
    const trx = transaction || (await db.transaction())

    let update_count = 0
    const update_list: any = {}

    for (const key in update) {
      if (key === 'address_info') continue
      update_list[key] = update[key]
      this[key] = update[key]
      update_count++
    }

    let address_id: number | undefined
    if (update.address_info && update.address_info.address) {
      const address = new Address(update.address_info)
      await address.insert(trx)
      address_id = address.address_id
    }
    if (address_id) {
      update_list.address_id = address_id
      this.address_id = address_id
      update_count++
    }

    update_count && (await trx('user').update(update_list).where({ user_id: this.user_id }))

    this.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')

    transaction || (await trx.commit())
  }

  async addRole(role_id: number) {
    const trx = await db.transaction()
    const role = await Role.getRole(role_id, trx)

    if (this.roles.some(role => role === 'aris user')) {
      const { role_id: base_id } = await Role.getRole('aris user', trx)
      await trx('user_role').update({ role_id }).where({ user_id: this.user_id, role_id: base_id })
      this.roles = [role.title]
    } else {
      await trx('user_role').insert({ user_id: this.user_id, role_id })
      this.roles.push(role.title)
    }

    await trx.commit()
  }

  async updateRole(new_role: RoleTypes, prev_role: RoleTypes) {
    const trx = await db.transaction()

    const n_role = await Role.getRole(new_role, trx)
    const p_role = await Role.getRole(prev_role, trx)

    await trx('user_role').update({ role_id: n_role.role_id }).where({ role_id: p_role.role_id })
    this.roles.map(role => (role === p_role.title ? n_role.title : role))

    await trx.commit()
  }

  async removeRole(role_id: number) {
    await db('user_role').del().where({ user_id: this.user_id, role_id })
  }

  /**
   * returns an user if it`s registered in the database
   * @param identifier - an user id or email
   */
  static async getUser(identifier: string | number): Promise<User | BaseUser> {
    const user_info: ArisUser = await db('user_view')
      .where(typeof identifier === 'string' ? { email: identifier } : { user_id: identifier })
      .then(row => (row[0] ? Data.parseDatetime(row[0]) : null))

    const roles = await db('user_role_view')
      .select('title')
      .where({ user_id: user_info.user_id })
      .then(row => (row[0] ? row.map(role => role.title) : null))
    if (!roles) throw new ArisError('Couldn`t found user roles!', 500)

    user_info.roles = roles

    if (!user_info) throw new ArisError('User don`t exists!', 403)
    if (user_info.roles.some(role => role === 'base user')) return new BaseUser(user_info)
    return new User(user_info)
  }
}
