import BaseUser from '../models/user/baseUserModel'
import captcha from '../middlewares/recaptcha'
import User from '../models/user/userModel'
import ArisError from '../utils/arisError'
import Mail from '../services/nodemailer'
import redis from '../services/redis'
import UserUtils from '../utils/user'
import { v4 as uuidv4 } from 'uuid'
import Data from '../utils/data'
import argon from 'argon2'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/validate-session', async (req: Request, res: Response) => {
  try {
    return res.status(200).send({ success: true, message: 'Session validated!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Validate session')
    return res.status(result.status).send(result.send)
  }
})

route.get('/logout', async (req: Request, res: Response) => {
  try {
    UserUtils.logout(req)

    return res.status(200).send({ success: true, message: 'User logged out!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Logout')
    return res.status(result.status).send(result.send)
  }
})

route.post('/login', captcha, async (req: Request, res: Response) => {
  const { email, password, remember_me } = req.body

  try {
    Data.validate({ email, password }, 'user_login')

    const user = await User.getUser(email)

    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)

    const access_token = UserUtils.generateAccessToken(user, remember_me)

    return res.status(200).send({ success: true, message: 'Login authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/register', captcha, async (req: Request, res: Response) => {
  const { name, surname, email, birthday, password } = req.body
  const user_info = { name, surname, email, birthday, password }

  try {
    Data.validate(user_info, 'base_user_register')

    const hasUser = await BaseUser.exist(email)
    if (hasUser) throw new ArisError('User already exists', 400)

    const token = uuidv4()
    redis.client.setex(`register.${token}`, 86400, JSON.stringify(user_info))
    await Mail.confirmEmail({ to: email, token, link: 'link' })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Registration')
    return res.status(result.status).send(result.send)
  }
})

route.post('/confirm-register', async (req: Request, res: Response) => {
  const { token } = req.body

  try {
    const reply = await redis.client.getAsync(`register.${token}`)
    if (!reply) throw new ArisError('Invalid token!', 403)
    const user_info = JSON.parse(reply)

    const user = new BaseUser(user_info)
    await user.insert()
    const access_token = UserUtils.generateAccessToken(user)

    redis.client.del(`register.${token}`)

    return res.status(200).send({
      success: true,
      message: 'Registration complete!',
      access_token
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
})

route.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body

  try {
    Data.validate({ email }, 'forgot_password')

    const id = await User.exist(email)
    if (!id) throw new ArisError('User don`t exist!', 403)

    const token = uuidv4()
    redis.client.setex(`reset.${token}`, 3600, id.toString())
    await Mail.forgotPass({ to: email, token, link: 'link' })

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

route.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body

  try {
    Data.validate({ password }, 'reset_password')

    const reply = await redis.client.getAsync(`reset.${token}`)
    if (!reply) throw new ArisError('Invalid token!', 403)
    const id = parseInt(reply)

    const user = await User.getUser(id)
    await user.update({ password })

    redis.client.del(`reset.${token}`)

    return res.status(200).send({ success: true, message: 'Password changed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password!')
    return res.status(result.status).send(result.send)
  }
})

export default route
