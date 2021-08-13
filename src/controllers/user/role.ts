import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/users(/:user_id)?/roles', auth, async (req: Request, res: Response) => {
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

  .get('/users(/:user_id)?/roles/universities', auth, async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id)

    try {
      const universities = await UserService.role.findUniversities(user_id)

      return res.status(200).send({ success: true, message: 'Fetch compete!', universities })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .get('/users(/:user_id)?/roles(/administrator|/moderator|/professor|/student)', auth, async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id)
    const path = req.path.split('/')
    const title = path[path.length - 1]

    try {
      const result = await UserService.role.findRoleData(user_id, title)

      return res.status(200).send({ success: true, message: 'Fetch complete!', [title]: result })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  }) // for now user_id is mandatory (create filter in findRoleData function)

Router.route('/users/roles(/administrator|/moderator|/professor|/student)')
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
    const { auth } = req.body
    const path = req.path.split('/')
    const title = path[path.length - 1]

    try {
      await UserService.role.remove(auth.user_id, auth.roles, title)

      return res.status(200).send({ success: true, message: 'Role removed!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Remove role')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
