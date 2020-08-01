import { Request, Response, NextFunction } from 'express'

export default function permission(roles: ['admin' | 'student' | 'professor' | 'proponent']) {
  return function (req: Request, res: Response, next: NextFunction) {
    const allow = roles.some(role => req.body._role === role)
    return allow ? next() : res.status(403).send({ success: false, message: `User of type ${req.body._role} is not allowed to access this route!` })
  }
}
