import { Request, Response, NextFunction } from 'express'
import { RoleTypes } from '../types'

type NRoleTypes = '!admin' | '!guest' | '!student' | '!professor' | '!customer' | '!evaluator' | '!moderator'

export default (roles: (RoleTypes | NRoleTypes)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    const allow = roles.reduce<number>((acc, role) => {
      const r = role.split('!')
      const flag = r.length !== 1

      const has_role = flag
        ? req.body._roles.some((user_role: string) => user_role === r[1])
        : req.body._roles.some((user_role: string) => user_role === r[0])
      const allowed = flag ? !has_role : has_role

      return allowed * acc
    }, 1)

    return allow ? next() : res.status(403).send({ success: false, message: `User not allowed to access this route!`, route_roles: roles })
  }
}
