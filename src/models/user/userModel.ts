import BaseUser, { ArisBaseUser } from './baseUserModel'
import Address, { ArisAddress } from './addressModel'
import Role, { RoleTypes } from './roleModel'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'
import { Transaction } from 'knex'
import db from '../../database'
import argon from 'argon2'

export interface UpdateUserObj {
  name?: string
  surname?: string
  password?: string
  phone?: string
  address_info?: ArisAddress
}

export interface ArisUser extends ArisBaseUser {
  phone?: string
  role: RoleTypes
  address_id?: number
}

export default class User extends BaseUser {
  phone?: string
  role: RoleTypes
  address_id: number

  /**
   * Creates an user.
   */
  constructor({ user_id, name, surname, email, birthday, password, role, phone, address_id, created_at, updated_at }: ArisUser) {
    super({ user_id, name, surname, email, birthday, password, created_at, updated_at })
    this.phone = phone
    this.role = role
    this.address_id = address_id ? address_id : 0
  }

  /**
   * Updates this user in the database.
   */
  async update({ name, surname, password, phone, address_info }: UpdateUserObj, transaction?: Transaction) {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.updated_at = date

    const trx = transaction || (await db.transaction())

    let address_id: number | undefined

    if (address_info && address_info.address) {
      const address = new Address(address_info)
      await address.insert(trx)
      address_id = address.address_id
    }

    let update = 0
    const update_list: any = {}
    if (name) {
      update_list.name = name
      this.name = name
      update++
    }
    if (surname) {
      update_list.surname = surname
      this.surname = surname
      update++
    }
    if (password) {
      const hash = await argon.hash(password)
      update_list.password = hash
      this.password = hash
      update++
    }
    if (phone) {
      update_list.phone = phone
      this.phone = phone
      update++
    }
    if (address_id) {
      update_list.address_id = address_id
      this.address_id = address_id
      update++
    }

    if (update)
      await trx('user')
        .update({ ...update_list, updated_at: this.updated_at })
        .where({ user_id: this.user_id })

    transaction || (await trx.commit())
  }

  /**
   * Delets this user in the database.
   */
  async delete() {
    const trx = await db.transaction()

    await trx('role_user').del().where({ user_id: this.user_id })
    super.delete(trx)
  }

  /**
   * Completes the user account and updates in the Database.
   */
  static async completeRegister(base_user: BaseUser | User, address_info: ArisAddress, role: RoleTypes, phone?: string) {
    if (!(base_user.role === 'base user')) throw new ArisError('This account isn`t of type base user!', 403)

    const trx = await db.transaction()

    const new_role = await Role.getRole(role, trx)
    await trx('role_user').update({ role_id: new_role.role_id }).where({ user_id: base_user.user_id })

    const user = new User({ ...base_user, phone, role })
    await user.update({ phone, address_info }, trx)

    await trx.commit()

    return user
  }

  /**
   * returns an user if it`s registered in the database
   * @param identifier - an user id or email
   */
  static async getUser(identifier: string | number): Promise<User | BaseUser> {
    const user_info: ArisUser = await db('user_view')
      .where(typeof identifier === 'string' ? { email: identifier } : { user_id: identifier })
      .then(row => (row[0] ? Data.parseDatetime(row[0]) : null))
    if (!user_info) throw new ArisError('User don`t exists!', 403)
    if (user_info.role === 'base user') return new BaseUser(user_info)
    return new User(user_info)
  }
}
