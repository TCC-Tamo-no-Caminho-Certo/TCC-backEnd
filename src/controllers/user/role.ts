import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/role/:title')
  .get(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id }
    } = req.body
    const { title } = req.params

    try {
      const result = await UserService.role.get(user_id, title)

      return res.status(200).send({ success: true, message: 'Fetch role complete!', [title]: result })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch role')
      return res.status(result.status).send(result.send)
    }
  })

  .patch(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data
    } = req.body
    const { title } = req.params

    try {
      await UserService.role.update(user_id, title, data)

      return res.status(200).send({ success: true, message: 'Patch role complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Patch role')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id }
    } = req.body
    const { title } = req.params

    try {
      await UserService.role.remove(user_id, title)

      return res.status(200).send({ success: true, message: 'Remove role complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Remove role')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
