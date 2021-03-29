import ValSchema, { P } from '../../utils/validation'
import University from '../../utils/university'
import ArisError from '../../utils/arisError'
import Mail from '../../services/nodemailer'
import redis from '../../services/redis'
import User from '../../utils/user'
import crypto from 'crypto'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.post('/email', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id, email, university_id } = req.body

  try {
    new ValSchema({
      email: P.joi.string().email().required(),
      university_id: P.joi.number().positive().allow(null)
    }).validate({ email, university_id })

    const [has_email] = await User.Email.find({ address: email })
    if (has_email) throw new ArisError('Email already in use!', 400)

    if (university_id) {
      const [university] = await University.find({ university_id })
      const regex = [new RegExp(university.get('regex').email.professor), new RegExp(university.get('regex').email.student)]

      if (!regex.some(reg => reg.test(email))) throw new ArisError('Invalid email format!', 400)
    }

    const token = crypto.randomBytes(3).toString('hex')
    redis.client.setex(`email:${token}`, 86400, JSON.stringify({ user_id, university_id, address: email, options: {} }))
    await Mail.confirmEmail({ to: email, token })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/email/:id')
  .patch(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id, options } = req.body
    const email_id = parseInt(req.params.id)

    try {
      const [email] = await User.Email.find({ user_id, email_id })
      if (!email) throw new ArisError('Emails not vinculated with this user!', 400)
      await email.update({ options })

      return res.status(200).send({ success: true, message: 'Get user info complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get user info')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id } = req.body
    const email_id = parseInt(req.params.id)

    try {
      const [email] = await User.Email.find({ user_id, email_id })
      if (!email) throw new ArisError('Emails not vinculated with this user!', 400)
      await email.delete()

      return res.status(200).send({ success: true, message: 'Delete email complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete email')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
