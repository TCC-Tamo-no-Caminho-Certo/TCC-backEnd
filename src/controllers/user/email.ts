import ValSchema, { P } from '../../utils/validation'
import University from '../../utils/university'
import UserService from '../../services/user'
import ArisError from '../../utils/arisError'
import Mail from '../../services/nodemailer'
import redis from '../../services/redis'
import User from '../../utils/user'
import crypto from 'crypto'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.post('/email', auth, async (req: Request, res: Response) => {
  const {
    auth: { user_id },
    data
  } = req.body

  try {
    await UserService.email.add(user_id, data)

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/email/:id')
  .patch(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data
    } = req.body
    const id = parseInt(req.params.id)

    try {
      await UserService.email.update({ id, user_id }, data)

      return res.status(200).send({ success: true, message: 'Get user info complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get user info')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id }
    } = req.body
    const id = parseInt(req.params.id)

    try {
      await UserService.email.remove({ id, user_id })

      return res.status(200).send({ success: true, message: 'Delete email complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete email')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
