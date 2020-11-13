import { Request, Response, NextFunction } from 'express'
import { RoleTypes } from '../models/user/roleModel'

export default (roles: (RoleTypes)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allow = roles.some(role => req.body._role === role)
    return allow ? next() : res.status(403).send({ success: false, message: `User of type ${req.body._role} is not allowed to access this route!` })
  }
}
