import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get(/\/users(\/:user_id)?\/roles$/, auth, async (req: Request, res: Response) => {
    const { page, per_page, ...filter } = req.query
    const { user_id } = req.params

    try {
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }
      filter.user_id = user_id

      const roles = await UserService.role.find(filter, pagination)

      return res.status(200).send({ success: true, message: 'Fetch complete!', [user_id ? 'roles' : 'users']: user_id ? roles[0].roles : roles })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .get(/\/users(\/:id)?\/roles\/(moderator|professor|student)$/, auth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const path = req.path.split('/')
    const title = path[path.length - 1]

    try {
      const result = await UserService.role.findRoleData(id, title)

      return res.status(200).send({ success: true, message: 'Fetch complete!', [title]: result })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

Router.route(/\/users\/roles\/(moderator|professor|student)$/)
  .patch(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data
    } = req.body
    const path = req.path.split('/')
    const title = path[path.length - 1]

    try {
      await UserService.role.update(user_id, title, data)

      return res.status(200).send({ success: true, message: 'Role Updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update role')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id }
    } = req.body
    const path = req.path.split('/')
    const title = path[path.length - 1]

    try {
      await UserService.role.remove(user_id, title)

      return res.status(200).send({ success: true, message: 'Role removed!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Remove role')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
