import auth from '../../src/middlewares/auth'
import captcha from '../../src/middlewares/recaptch'
import permition from '../../src/middlewares/permission'
import { Request, Response, NextFunction } from 'express'
import permission from '../../src/middlewares/permission'

describe('test middlewares', () => {
  test('auth', () => {
    let req: Request
    let res: Response
    let next: NextFunction
    req.headers.authorization = 'token'
    expect(auth(req, res, next)).toBeUndefined()
  })

  test('permission', () => {
    let req: Request
    let res: Response
    let next: NextFunction
    req.body._role = 'professor'
    expect(permission(['admin', 'professor'])(req, res, next)).toBeUndefined()
  })
})
