import { generateAccessToken, logout } from '../utils'
import BaseUser from '../models/user/baseUserModel'
import ArisError from '../models/arisErrorModel'
import captcha from '../middlewares/recaptcha'
import User from '../models/user/userModel'
import Data from '../models/dataModel'
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
    logout(req)

    return res.status(200).send({
      success: true,
      message: 'User logged out!'
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Logout')
    return res.status(result.status).send(result.send)
  }
})

route.post('/register', captcha, async (req: Request, res: Response) => {
  const { name, surname, email, birthday, password } = req.body
  const user_info = { name, surname, email, birthday, password }

  try {
    Data.validate(user_info, 'base_user_register')

    const user = new BaseUser(user_info)
    await user.insert()
    const access_token = generateAccessToken(user)

    return res.status(200).send({
      success: true,
      message: 'Registration complete!',
      user,
      access_token
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Registration')
    return res.status(result.status).send(result.send)
  }
})

route.post('/login', captcha, async (req: Request, res: Response) => {
  const { email, password, remember_me } = req.body

  try {
    Data.validate({ email, password }, 'user_login')

    const user = await User.getUser(email)

    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)

    const access_token = generateAccessToken(user, remember_me)

    return res.status(200).send({ success: true, message: 'Login authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body

  try {
    Data.validate({ email }, 'forgot_password')

    const ResetPasswordToken = await User.forgotPassword(<string>email)

    return res.status(200).send({ success: true, message: 'Email sended!', ResetPasswordToken })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

route.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body

  try {
    const result = await User.resetPassword(token, password)

    return res.status(200).send({ success: true, message: 'Password changed!', ...result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password!')
    return res.status(result.status).send(result.send)
  }
})

export default route
