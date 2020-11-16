import { Request, Response, NextFunction } from 'express'
import redis from '../services/redis'

export default async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(403).send({ success: false, message: 'No token provided!' })

  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(403).send({ success: false, message: 'Token error!' })

  const [bearer, token] = parts
  if (!/^Bearer$/i.test(bearer)) return res.status(403).send({ success: false, message: 'Token malformated!' })

  const user_id = await redis.client.getAsync(`auth.${token}`)
  if (!user_id) return res.status(403).send({ success: false, message: 'Invalid token!' })
  const reply = await redis.client.getAsync(`auth.data.${user_id}`)
  if (!reply) return res.status(500).send({ success: false, message: `Couldn't find user data in redis!` })
  
  const data = JSON.parse(reply)
  req.body._user_id = data.id
  req.body._roles = data.roles

  next()
}
