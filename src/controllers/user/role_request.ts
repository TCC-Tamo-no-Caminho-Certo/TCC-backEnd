import UserService from '../../services/user'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/users(/:user_id)?/roles/requests(/:id)?', auth, permission(['moderator']), async (req: Request, res: Response) => {
    const { page, per_page, ...filter } = req.query
    const { id, user_id } = req.params

    try {
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }
      filter.user_id = user_id || filter.user_id
      filter.id = id || filter.id

      const requests = await UserService.role.request.find(filter, pagination)

      return res.status(200).send({ success: true, message: 'Fecth complete!', [id ? 'request' : 'requests']: id ? requests[0] : requests })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fecth')
      return res.status(result.status).send(result.send)
    }
  })

  .post(
    '/users/roles/requests/moderator|professor|student',
    auth,
    (req: Request, res: Response, next) => {
      const path = req.path.split('/')
      const role = path[path.length - 1]

      switch (role) {
        case 'student':
          return permission(['student'], ['guest'])(req, res, next)

        case 'professor':
          return permission(['professor'], ['guest'])(req, res, next)

        case 'moderator':
          return permission(['moderator'], ['professor'])(req, res, next)

        default:
          return res.status(403).send({ success: false, message: 'Role provided does not exists!' })
      }
    },
    async (req: Request, res: Response, next) => {
      const { auth, data } = req.body
      const path = req.path.split('/')
      const role = path[path.length - 1]

      try {
        switch (role) {
          case 'student':
            await UserService.role.request.createStudent(auth.user_id, auth.roles, data)
            return res.status(200).send({ success: true, message: 'Student request sended!' })

          case 'professor':
            await UserService.role.request.createProfessor(auth.user_id, auth.roles, data)
            return res.status(200).send({ success: true, message: 'Professor request sended!' })

          case 'moderator':
            await UserService.role.request.createModerator(auth.user_id, auth.roles, data)
            return res.status(200).send({ success: true, message: 'Moderator request sended!' })

          default:
            return res.status(403).send({ success: false, message: 'Role provided do not exists!' })
        }
      } catch (error) {
        const result = ArisError.errorHandler(error, 'Request role')
        return res.status(result.status).send(result.send)
      }
    }
  )

  .patch('/users/roles/requests/:id/moderator|professor|student', auth, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { auth, data } = req.body
    const path = req.path.split('/')
    const role = path[path.length - 2]

    try {
      switch (role) {
        case 'student':
          await UserService.role.request.updateStudent({ id, user_id: auth.user_id }, data)
          return res.status(200).send({ success: true, message: 'Student request updated!' })

        case 'professor':
          await UserService.role.request.updateProfessor({ id, user_id: auth.user_id }, data)
          return res.status(200).send({ success: true, message: 'Professor request updated!' })

        case 'moderator':
          await UserService.role.request.updateModerator({ id, user_id: auth.user_id }, data)
          return res.status(200).send({ success: true, message: 'Moderator request updated!' })

        default:
          return res.status(403).send({ success: false, message: 'Role provided do not exists!' })
      }
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update request')
      return res.status(result.status).send(result.send)
    }
  })

  .patch('/users/roles/requests/:id/accept', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
    const request_id = parseInt(req.params.id)

    try {
      await UserService.role.request.accept(request_id)

      return res.status(200).send({ success: true, message: 'Accept complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Accept')
      return res.status(result.status).send(result.send)
    }
  })

  .patch('/users/roles/requests/:id/reject', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
    const request_id = parseInt(req.params.id)
    const { feedback } = req.body

    try {
      await UserService.role.request.reject(request_id, feedback)

      return res.status(200).send({ success: true, message: 'Reject complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Reject')
      return res.status(result.status).send(result.send)
    }
  })

  .delete('/users/roles/requests/:id', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
    const request_id = parseInt(req.params.id)

    try {
      await UserService.role.request.delete(request_id)

      return res.status(200).send({ success: true, message: 'Delete complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete')
      return res.status(result.status).send(result.send)
    }
  })

  .get('/users/roles/requests/voucher/:uuid', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
    const voucher_uuid = req.params.uuid

    try {
      const url = await UserService.role.request.getVoucher(voucher_uuid)

      return res.status(200).send({ success: true, message: 'Fetch complete!', url })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
