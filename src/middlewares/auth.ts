import { Request, Response, NextFunction } from 'express'
import config from '../config'
import jwt from 'jsonwebtoken'

export default (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization

  if (!auth) return res.status(401).json({ Success: false, Message: 'No token provided!' })

  const parts = auth.split(' ')

  if (parts.length !== 2) return res.status(401).json({ Success: false, Message: 'Token error!' })

  const [bearer, token] = parts

  if (!/^Bearer$/i.test(bearer)) return res.status(401).json({ Success: false, Message: 'Token malformated!' })

  jwt.verify(token, config.jwt.publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err)
      return err.name === 'TokenExpiredError'
        ? res.status(401).json({ Success: false, Message: 'Token expired!' })
        : res.status(401).json({ Success: false, Message: 'Invalid token!' })

    req.body._user_id = (<any>decoded).id
    req.body._role = (<any>decoded).role
    next()
  })
}
