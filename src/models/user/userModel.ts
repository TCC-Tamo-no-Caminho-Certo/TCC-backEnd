import forgetMail from '../../services/nodemailer/forgetPassword'
import BaseUser, { ArisBaseUser } from './baseUserModel'
import Address, { ArisAddress } from './addressModel'
import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import db from '../../database'
import Role from './roleModel'

export interface UpdateUserObj {
  name?: string
  sur_name?: string
  phone?: string
  address_info?: ArisAddress
}

export interface ArisUser extends ArisBaseUser {
  id_user: number
  phone?: string
  role: string
  address_id?: number
}

export default class User extends BaseUser {
  phone?: string
  address_id: number

  /**
   * Creates an user.
   */
  constructor({ id_user, name, sur_name, email, password, role, phone, address_id }: ArisUser) {
    super({ id_user, name, sur_name, email, password })
    this.phone = phone
    this.role = role
    this.address_id = address_id ? address_id : 0
  }

  async update({ name, sur_name, phone, address_info }: UpdateUserObj, transaction?: Transaction) {
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    this.updated_at = date

    const trx = transaction || (await db.transaction())

    let address_id: number | undefined

    if (address_info && address_info.address) {
      const address = new Address(address_info)
      await address.insert(trx)
      address_id = address.id_address
    }

    let update = 0
    const update_list: any = {}
    if (name) {
      update_list.name = name
      this.name = name
      update++
    }
    if (sur_name) {
      update_list.sur_name = sur_name
      this.sur_name = sur_name
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
        .where({ id_user: this.id_user })

    transaction || (await trx.commit())
  }

  async delete() {}

  static async completeRegister(base_user: BaseUser | User, address_info: ArisAddress, role: string, phone?: string) {
    if (!(base_user.role === 'base user') ? true : false)
      throw new ArisError('This account isn`t of type base user!', 403)

    const trx = await db.transaction()

    const new_role = await Role.getRole(role, trx)
    await trx('role_user').update({ role_id: new_role.id_role }).where({ user_id: base_user.id_user })

    const user = new User({ ...base_user, phone, role })
    await user.update({ phone, address_info }, trx)

    await trx.commit()

    return user
  }

  /**
   * returns an user
   * @param identifier - an user id or email
   */
  static async getUser(identifier: string | number): Promise<User | BaseUser> {
    const user_info: ArisUser = await db('user_view')
      .where(typeof identifier === 'string' ? { email: identifier } : { id_user: identifier })
      .then(row => (row[0] ? row[0] : null))
    if (!user_info) throw new ArisError('User don`t exists!', 403)
    if (user_info.role === 'base user') return new BaseUser(user_info)
    return new User(user_info)
  }
}
