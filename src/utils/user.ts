import BaseUser from '../models/user/baseUserModel'
import User from '../models/user/userModel'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'

import { Request } from 'express'

export default class UserUtils {
  /**
   * Generate an access_token for the user.
   */
  static async generateAccessToken(user: BaseUser | User, remember?: boolean) {
    const { user_id, roles } = user
    const token = uuidv4()

    const data = JSON.parse(await redis.client.getAsync(`auth.data.${user_id}`))

    if (data) {
      await redis.client.setexAsync(`auth.${token}`, remember ? 2592000 : 86400, user_id.toString())
    } else {
      await redis.client.setAsync(
        `auth.data.${user_id}`,
        JSON.stringify({
          id: user_id,
          roles
        })
      )
      await redis.client.setexAsync(`auth.${token}`, remember ? 2592000 : 86400, user_id.toString())
    }

    return token
  }

  /**
   * Updates access_token of an user.
   */
  static async updateAccessTokenData(user: BaseUser | User) {
    const { user_id, roles } = user

    await redis.client.delAsync(`auth.data.${user_id}`)
    await redis.client.setAsync(
      `auth.data.${user_id}`,
      JSON.stringify({
        id: user_id,
        roles
      })
    )
  }

  /**
   * Logs out the user.
   */
  static async logout(req: Request) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts

    await redis.client.delAsync(`auth.${token}`)
  }
}
