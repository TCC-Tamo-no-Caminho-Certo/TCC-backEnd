import forgetMail from '../services/nodemailer/forgetPassword'
import BaseUser from '../models/user/baseUserModel'
import ArisError from '../models/arisErrorModel'
import User from '../models/user/userModel'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'
import config from '../config'
import jwt from 'jsonwebtoken'

import { Request } from 'express'

//----------------------------------------- ARQUIVO TEMPORÁRIO ATÉ DECIDIR O Q FAZER -------------------------------------------------------

/**
 * Generate an access_token for the user.
 */
export function generateAccessToken(user: BaseUser | User, remember?: boolean) {
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
export function logout(req: Request) {
  const auth = <string>req.headers.authorization
  const parts = auth.split(' ')
  const [, token] = parts
  redis.client.del(`auth.${token}`)
}

/**
 * Sends an email for the user with a link to reset his password.
 */
export async function forgotPassword(email: string) {
  const id = await User.exist(email)
  if (!id) throw new ArisError('User don`t exist!', 403)

  const token = jwt.sign({ id }, config.jwt.resetSecret, { expiresIn: '1h' })

  await forgetMail({ to: email, token, link: 'link' })

  redis.client.setex(`reset.${token}`, 3600, id.toString())
}

/**
 * Updates the user`s password in the database.
 */
export async function resetPassword(token: string, password: string) {
  const id: any = jwt.verify(token, config.jwt.resetSecret, (err, decoded) => {
    if (err) throw new ArisError(err.name === 'TokenExpiredError' ? 'Token expired!' : 'Invalid token signature!', 401)
    return (<any>decoded).id
  })

  const user = await User.getUser(id)
  await user.update({ password })
  redis.client.del(`reset.${token}`)

  return { id, hash: user.password }
}
