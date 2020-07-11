import { Request, Response, NextFunction } from 'express'

export function professor(req: Request, res: Response, next: NextFunction) {
  const professor = req.body.role === 'professor'

  if (!professor) return res.status(403).send({ Success: false, Message: 'User is not a professor!' })
  next()
}