import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/user')
  .get(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id, roles }
    } = req.body

    try {
      const user: any = await UserService.get(user_id)
      user.roles = roles

      return res.status(200).send({ success: true, message: 'Get user info complete!', user })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get user info')
      return res.status(result.status).send(result.send)
    }
  })

  .patch(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data,
      data: { password }
    } = req.body

    try {
      const user = await UserService.update({ id: user_id }, data, password)

      return res.status(200).send({ success: true, message: 'Update complete!', user })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data: { password }
    } = req.body
    const auth = req.headers.authorization!

    try {
      await UserService.delete({ id: user_id }, password, auth)

      return res.status(200).send({ success: true, message: 'Delete complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete')
      return res.status(result.status).send(result.send)
    }
  })

Router.put('/user/avatar', auth, async (req: Request, res: Response) => {
  const {
    auth: { user_id },
    data: { picture }
  } = req.body

  try {
    const avatar_uuid = await UserService.updateAvatar({ id: user_id }, picture)

    return res.status(200).send({ success: true, message: 'Avatar uploaded!', avatar_uuid })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/users', async (req: Request, res: Response) => {
  const { page, per_page, ...filter } = req.query

  try {
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

    const users = await UserService.find(filter, pagination)

    return res.status(200).send({ success: true, message: 'Get users complete!', users })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get users info')
    return res.status(result.status).send(result.send)
  }
})

export default Router
