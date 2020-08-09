import { Request, Response, NextFunction } from 'express'
import redis from '../services/redis'

export default (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(403).json({ success: false, message: 'No token provided!' })

  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(403).json({ success: false, message: 'Token error!' })

  const [bearer, token] = parts
  if (!/^Bearer$/i.test(bearer)) return res.status(403).json({ success: false, message: 'Token malformated!' })

  redis.client?.get(`auth.${token}`, function (err, reply) {
    if (err) return res.status(500).json({ success: false, message: 'Redis auth error!' })
    if (!reply) return res.status(403).json({ success: false, message: 'Invalid token!' })

    const data = JSON.parse(reply)
    req.body._user_id = data.id
    req.body._role = data.role
    
    next()
  })
  // jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
  //   if (err)
  //     return err.name === 'TokenExpiredError'
  //       ? res.status(403).json({ success: false, message: 'Token expired!' })
  //       : res.status(403).json({ success: false, message: 'Invalid token!' })
  //   req.body._user_id = (<any>decoded).id
  //   req.body._role = (<any>decoded).role
  //   next()
  // })
}
