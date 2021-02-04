import BaseUser from '../models/user/baseUserModel'
import ValSchema, { P } from '../utils/validation'
import captcha from '../middlewares/recaptcha'
import User from '../models/user/userModel'
import ArisError from '../utils/arisError'
import Mail from '../services/nodemailer'
import redis from '../services/redis'
import UserUtils from '../utils/user'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import argon from 'argon2'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/api/validate-session', async (req: Request, res: Response) => {
  try {
    return res.status(200).send({ success: true, message: 'Valid session!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Validate session')
    return res.status(result.status).send(result.send)
  }
})

route.get('/api/logout', async (req: Request, res: Response) => {
  try {
    UserUtils.logout(req)

    return res.status(200).send({ success: true, message: 'User logged out!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Logout')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/login', captcha, async (req: Request, res: Response) => {
  const { email, password, remember } = req.body

  try {
    new ValSchema({
      email: P.user.email.required(),
      password: P.user.password.required(),
      remember: P.auth.remember.allow(null)
    }).validate({ email, password, remember })

    const user = await User.getUser(email)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 400)
    const access_token = await UserUtils.generateAccessToken(user, remember)

    return res.status(200).send({ success: true, message: 'Login authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/register', captcha, async (req: Request, res: Response) => {
  const { name, surname, email, birthday, password } = req.body
  const user_info = { name, surname, emails: email, birthday, password }

  try {
    new ValSchema({
      name: P.user.name.required(),
      surname: P.user.surname.required(),
      emails: P.user.email.required(),
      birthday: P.user.birthday.required(),
      password: P.user.password.required()
    }).validate(user_info)

    const hasUser = await User.exist(email)
    if (hasUser) throw new ArisError('User already exists', 400)

    const token = uuidv4()
    redis.client.setex(`register.${token}`, 86400, JSON.stringify(user_info))
    await Mail.confirmEmail({ to: email, token })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.get('/confirm-register/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    new ValSchema(P.auth.token.required()).validate(token)

    const reply = await redis.client.getAsync(`register.${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)

    const user_info = JSON.parse(reply)

    const user = new BaseUser(user_info)
    user.password = await argon.hash(user.password)
    await user.insert()

    redis.client.del(`register.${token}`)

    return res.status(201).send({ success: true, message: 'Register complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/forgot-password', captcha, async (req: Request, res: Response) => {
  const { email } = req.body

  try {
    new ValSchema(P.user.email.required()).validate(email)

    const id = await User.exist(email)
    if (!id) throw new ArisError('User don`t exist!', 400)

    const token = crypto.randomBytes(3).toString('hex')

    redis.client.setex(`reset.${token}`, 3600, id.toString())
    await Mail.forgotPass({ to: email, token })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/reset-password', captcha, async (req: Request, res: Response) => {
  const { token, password } = req.body

  try {
    new ValSchema(P.auth.token.required()).validate(token)

    const reply = await redis.client.getAsync(`reset.${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)
    const id = parseInt(reply)

    if (!password) return res.status(200).send({ success: true, message: 'Valid reset token!' })

    new ValSchema(P.user.password.required()).validate(password)

    const user = await User.getUser(id)
    const new_hash = await argon.hash(password)
    user.password = new_hash
    await user.update()

    redis.client.del(`reset.${token}`)

    return res.status(200).send({ success: true, message: 'Password changed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

export default route
