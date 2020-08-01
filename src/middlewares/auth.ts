import { Request, Response, NextFunction } from 'express'
import config from '../config'
import jwt from 'jsonwebtoken'

export default (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization

  if (!auth) return res.status(401).json({ success: false, message: 'No token provided!' })

  const parts = auth.split(' ')

  if (parts.length !== 2) return res.status(401).json({ success: false, message: 'Token error!' })

  const [bearer, token] = parts

  if (!/^Bearer$/i.test(bearer)) return res.status(401).json({ success: false, message: 'Token malformated!' })

  jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err)
      return err.name === 'TokenExpiredError'
        ? res.status(401).json({ success: false, message: 'Token expired!' })
        : res.status(401).json({ success: false, message: 'Invalid token!' })

    req.body._user_id = (<any>decoded).id
    req.body._role = (<any>decoded).role
    next()
  })
}
