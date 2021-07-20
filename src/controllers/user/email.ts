import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/users(/:user_id)?/emails(/:id)?', auth, async (req: Request, res: Response) => {
  const { page, per_page, ...filter } = req.query
  const { id, user_id } = req.params

  try {
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }
    filter.user_id = user_id
    filter.id = id

    const emails = await UserService.email.find(filter, pagination)

    return res.status(200).send({ success: true, message: 'Fetch complete!', [id ? 'email' : 'emails']: id ? emails[0] : emails })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/user/emails(/:id)?')
  .get(auth, async (req: Request, res: Response) => {
    const { page, per_page, ...filter } = req.query
    const { id } = req.params
    const {
      auth: { user_id }
    } = req.body

    try {
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }
      filter.user_id = user_id
      filter.id = id

      const emails = await UserService.email.find(filter, pagination)

      return res.status(200).send({ success: true, message: 'Fetch complete!', emails })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, async (req: Request, res: Response) => {
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

Router.route('/user/emails/:id')
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
