import ValSchema, { P } from '../utils/validation'
import ArisError from '../utils/arisError'
import Mail from '../services/nodemailer'
import redis from '../services/redis'
import { v4 as uuidv4 } from 'uuid'
import User from '../utils/user'
import crypto from 'crypto'

import { captcha, auth } from '../middlewares'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/api/validate-session', auth, async (req: Request, res: Response) => {
  try {
    return res.status(200).send({ success: true, message: 'Valid session!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Validate session')
    return res.status(result.status).send(result.send)
  }
})

route.get('/api/logout', auth, async (req: Request, res: Response) => {
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

    const [user_email] = await User.Email.find({ address: <string>email })
    if (!user_email || !user_email.get('main')) throw new ArisError('User not found!', 400)

    const user_id = user_email.get('user_id')

    const [user] = await User.find({ user_id })
    await user.verifyPassword(password)

    const roles = (await User.Role.find({ user_id })).map(role => role.format())

    const access_token = await User.generateAccessToken(user_id, roles, remember)

    return res.status(200).send({ success: true, message: 'Login authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/register', captcha, async (req: Request, res: Response) => {
  const { name, surname, email: address, birthday, phone, password } = req.body

  try {
    new ValSchema({
      name: P.user.name.required(),
      surname: P.user.surname.required(),
      address: P.user.email.required(),
      phone: P.user.phone,
      birthday: P.user.birthday.required(),
      password: P.user.password.required()
    }).validate({ name, surname, phone, birthday, password, address })

    const user_info = { name, surname, phone, birthday, password }
    const email_info = { user_id: 0, address, main: true, options: {} }

    const has_user = await User.exist(address)
    if (has_user) throw new ArisError('User already exists', 400)

    const token = uuidv4()
    redis.client.setex(`register:${token}`, 86400, JSON.stringify({ user_info, email_info }))
    await Mail.confirmRegister({ to: address, token })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.get('/confirm/register/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    new ValSchema(P.auth.token.required()).validate(token)

    const reply = await redis.client.getAsync(`register:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)

    const { user_info, email_info } = JSON.parse(reply)

    const user = await User.create(user_info)
    const user_id = user.get('user_id')
    await User.Role.addGuest(user_id)

    email_info.user_id = user_id
    await User.Email.create(email_info)

    redis.client.del(`register:${token}`)

    return res.status(201).send({ success: true, message: 'Register complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
}) // ADD OPTIONS ON EMAIL INFO

route.get('/confirm/email/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    new ValSchema(P.auth.token.required()).validate(token)

    const reply = await redis.client.getAsync(`email:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)

    const email_info = JSON.parse(reply)

    await User.Email.create(email_info)

    redis.client.del(`email:${token}`)

    return res.status(201).send({ success: true, message: 'Email confirmed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm email')
    return res.status(result.status).send(result.send)
  }
})

route.get('/api/forgot-password/:email', async (req: Request, res: Response) => {
  const { email } = req.params

  try {
    new ValSchema(P.user.email.required()).validate(email)

    const user_id = await User.exist(email)
    if (!user_id) throw new ArisError('User not found!', 400)

    const token = crypto.randomBytes(3).toString('hex')

    redis.client.setex(`reset:${token}`, 3600, user_id.toString())
    await Mail.forgotPass({ to: email, token })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/reset-password/:token', captcha, async (req: Request, res: Response) => {
  const { token } = req.params
  const { password } = req.body

  try {
    new ValSchema(P.auth.token.required()).validate(token)

    const reply = await redis.client.getAsync(`reset:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)
    const user_id = parseInt(reply)

    if (!password) return res.status(200).send({ success: true, message: 'Valid reset token!' })

    new ValSchema(P.user.password.required()).validate(password)

    const [user] = await User.find({ user_id })
    if (!user) throw new ArisError('Wrong id stored in redis to reset password!', 500)
    await user.update({ password })

    redis.client.del(`reset:${token}`)

    return res.status(200).send({ success: true, message: 'Password changed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

export default route
