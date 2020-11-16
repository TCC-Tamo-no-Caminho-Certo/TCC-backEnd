import UserUtils from '../../utils/user'
import db from '../../database'
import User from './userModel'
import Role from './roleModel'

export default class Moderator {
  static async addUserRole(user: User, role: Role) {
    const trx = await db.transaction()

    if (user.roles.some(role => role === 'base user')) {
      const { role_id } = await Role.getRole('base user', trx)
      await trx('user_role').update({ user_id: user.user_id, role_id: role.role_id }).where({ role_id })
    } else {
      await trx('user_role').insert({ user_id: user.user_id, role_id: role.role_id })
    }

  }

  static async removeUserRole(user_id: number, role_id: number) {
    await db('user_role').del().where({ user_id, role_id })
  }
}