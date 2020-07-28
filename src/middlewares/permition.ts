import { Request, Response, NextFunction } from 'express'

export function professor(req: Request, res: Response, next: NextFunction) {
  const professor = req.body._role === 'professor'

  if (!professor) return res.status(403).send({ Success: false, Message: 'User is not a professor!' })
  next()
}

export function admin(req: Request, res: Response, next: NextFunction) {
  const admin = req.body._role === 'admin'

  if (!admin) return res.status(403).send({ Success: false, Message: 'User is not an admin!' })
  next()
}
