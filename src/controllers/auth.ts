import ValSchema, { P } from '../utils/validation'
import captcha from '../middlewares/recaptcha'
import ArisError from '../utils/arisError'
import Mail from '../services/nodemailer'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'
import User from '../utils/user'
import crypto from 'crypto'
// MAYBE PASS REDIS, ARGON AND CRYPTO TO USER UTILS.

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
    User.deleteAccessToken(req)

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

    const user = await User.get(email)
    await user.verifyPassword(password)
    const access_token = await user.generateAccessToken(remember)

    return res.status(200).send({ success: true, message: 'Login authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/register', captcha, async (req: Request, res: Response) => {
  const { name, surname, email, birthday, phone, password } = req.body
  const user_info = { name, surname, email, phone, birthday, password }

  try {
    new ValSchema({
      name: P.user.name.required(),
      surname: P.user.surname.required(),
      email: P.user.email.required(),
      phone: P.user.phone,
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
    const email_info = { address: user_info.email, options: {} }
    delete user_info.email

    await User.createUser(user_info, email_info)

    redis.client.del(`register.${token}`)

    return res.status(201).send({ success: true, message: 'Register complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
}) // ADD OPTIONS ON EMAIL INFO

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

    const user = await User.get(id)
    await user.updateUser({ password })

    redis.client.del(`reset.${token}`)

    return res.status(200).send({ success: true, message: 'Password changed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

export default route
