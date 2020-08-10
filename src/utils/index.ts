import BaseUser from '../models/user/baseUserModel'
import User from '../models/user/userModel'
import redis from '../services/redis'
import config from '../config'
import jwt from 'jsonwebtoken'

import { Request } from 'express'

//----------------------------------------- ARQUIVO TEMPORÁRIO ATÉ DECIDIR O Q FAZER -------------------------------------------------------

/**
 * generate an access_token for the user.
 */
export function generateAccessToken(user: BaseUser | User, remember?: boolean) {
  const payload = { id: user.user_id, role: user.role }

  const access_token = jwt.sign(payload, config.jwt.privateKey, {
    algorithm: 'RS256',
    expiresIn: remember ? '30d' : '24h'
  })
  redis.client.setex(`auth.${access_token}`, remember ? 2592000 : 86400, JSON.stringify(payload))

  return access_token
}

export function logout(req: Request) {
  const auth = <string>req.headers.authorization
  const parts = auth.split(' ')
  const [, token] = parts
  redis.client.del(`auth.${token}`)
}
