import { Request, Response, NextFunction } from 'express'
import { RoleTypes } from '../@types/types'

type NRoleTypes = `!${RoleTypes}`

/**
 * @param schemas - schema format: [role, (and) role...], (or) [role, (and) role...], (or)...
 */
export default (...schemas: (RoleTypes | NRoleTypes)[][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allow = schemas.reduce<number>((acc, roles) => {
      const allow = roles.reduce<number>((acc, role) => {
        const r = role.split('!')
        const flag = r.length !== 1

        const has_role = flag
          ? req.body.auth.roles.some((user_role: string) => user_role === r[1])
          : req.body.auth.roles.some((user_role: string) => user_role === r[0])
        const allowed = flag ? !has_role : has_role

        return allowed ? acc : 0
      }, 1)

      return acc + allow
    }, 0)

    return allow
      ? next()
      : res.status(403).send({ success: false, message: `User not allowed to access this route!`, allowed_roles_schemas: schemas })
  }
}
