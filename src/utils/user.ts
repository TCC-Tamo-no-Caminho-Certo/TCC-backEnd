import forgetMail from '../services/nodemailer/forgetPassword'
import BaseUser from '../models/user/baseUserModel'
import User from '../models/user/userModel'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'
import ArisError from './arisError'

import { Request } from 'express'

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

  const token = uuidv4()

  await forgetMail({ to: email, token, link: 'link' })

  redis.client.setex(`reset.${token}`, 3600, id.toString())
}

/**
 * Updates the user`s password in the database.
 */
export async function resetPassword(token: string, password: string) {
  const id: any = redis.client.get(`reset.${token}`, (err, reply) => {
    if (err) throw new ArisError('Redis reset error!', 500)
    if (!reply) throw new ArisError('Invalid token!', 403)
    return reply
  })

  const user = await User.getUser(id)
  await user.update({ password })
  redis.client.del(`reset.${token}`)

  return { id, hash: user.password }
}

export async function confirmRegister(token: string) {
  const user_info: any = redis.client.get(`register.${token}`, (err, reply) => {
    if (err) throw new ArisError('Redis register error!', 500)
    if (!reply) throw new ArisError('Invalid token!', 403)

    return JSON.parse(reply)
  })
  const user = new BaseUser(user_info)
  await user.insert()

  return user
}
