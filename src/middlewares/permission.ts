import { Request, Response, NextFunction } from 'express'
import { RoleTypes } from '../types'

type NRoleTypes = '!admin' | '!guest' | '!student' | '!professor' | '!customer' | '!evaluator' | '!moderator'

export default (roles: (RoleTypes | NRoleTypes)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const d_roles: string[] = []

    const allow = roles.reduce<number>((acc, role) => {
      const r = role.split('!')
      const flag = r.length === 1 ? false : true

      const has_role = req.body._roles.some((user_role: string) => (flag ? user_role === r[1] : user_role === r[0]))
      const allowed = flag ? !has_role : has_role

      if (!allowed) d_roles.push(flag ? r[1] : r[0])
      return allowed * acc
    }, 1)
    
    return allow ? next() : res.status(403).send({ success: false, message: `User of type ${d_roles} is not allowed to access this route!` })
  }
}
