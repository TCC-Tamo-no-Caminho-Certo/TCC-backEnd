import UserService from '../services/user'
import ArisError from '../utils/arisError'

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

route.get('/api/sign-out', auth, async (req: Request, res: Response) => {
  const auth = req.headers.authorization!

  try {
    await UserService.signOut(auth)

    return res.status(200).send({ success: true, message: 'User logged out!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Logout')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/sign-in', captcha, async (req: Request, res: Response) => {
  const {
    data: { email, password, remember }
  } = req.body

  try {
    const access_token = await UserService.SignIn(email, password, remember)

    return res.status(200).send({ success: true, message: 'Sign In authorized!', access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Login')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/sign-up', captcha, async (req: Request, res: Response) => {
  const {
    data,
    data: { email }
  } = req.body

  try {
    await UserService.signUp(data, email)

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.get('/confirm/sign-up/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    await UserService.confirmSignUp(token)

    return res.status(201).send({ success: true, message: 'Register complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
}) // ADD OPTIONS ON EMAIL INFO

route.get('/confirm/email/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    await UserService.email.confirm(token)

    return res.status(201).send({ success: true, message: 'Email confirmed!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm email')
    return res.status(result.status).send(result.send)
  }
})

route.get('/api/forgot-password/:email', async (req: Request, res: Response) => {
  const { email } = req.params

  try {
    await UserService.forgotPassword(email)

    return res.status(200).send({ success: true, message: 'Email sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Send email')
    return res.status(result.status).send(result.send)
  }
})

route.post('/api/reset-password/:token', captcha, async (req: Request, res: Response) => {
  const { token } = req.params
  const {
    data: { password }
  } = req.body

  try {
    const updated = await UserService.resetPassword(token, password)

    return res.status(200).send(updated ? { success: true, message: 'Password changed!' } : { success: true, message: 'Valid reset token!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Change password')
    return res.status(result.status).send(result.send)
  }
})

export default route
