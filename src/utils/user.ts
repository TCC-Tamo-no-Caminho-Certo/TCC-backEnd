import BaseUser from '../models/user/baseUserModel'
import User from '../models/user/userModel'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'

import { Request } from 'express'

export default class UserUtils {

  /**
   * Generate an access_token for the user.
   */
  static generateAccessToken(user: BaseUser | User, remember?: boolean) {
    const token = uuidv4()
    redis.client.setex(
      `auth.${token}`,
      remember ? 2592000 : 86400,
      JSON.stringify({
        id: user.user_id,
        role: user.role
      })
    )
    return token
  }

  /**
   * Logs out the user.
   */
  static logout(req: Request) {
    const auth = <string>req.headers.authorization
    const parts = auth.split(' ')
    const [, token] = parts
    redis.client.del(`auth.${token}`)
  }
}
