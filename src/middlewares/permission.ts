import { Request, Response, NextFunction } from 'express'
import { RoleTypes } from '../types'

type NRoleTypes = '!admin' | '!guest' | '!student' | '!professor' | '!customer' | '!evaluator' | '!moderator'

export default (roles: (RoleTypes | NRoleTypes)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allow = roles.some(role => {
      const r = role.split('!')
      const not_allowed = r.length === 1 ? false : true
      const has_role = req.body._roles.some((user_role: string) => (not_allowed ? user_role === r[1] : user_role === r[0]))
      return not_allowed ? !has_role : has_role
    })
    return allow ? next() : res.status(403).send({ success: false, message: `User of type ${req.body._roles} is not allowed to access this route!` })
  }
}
