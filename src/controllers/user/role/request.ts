import ValSchema, { P } from '../../../utils/validation'
import UserService from '../../../services/user'
import ArisError from '../../../utils/arisError'
import File from '../../../utils/minio'
import User from '../../../utils/user'

import { auth, permission } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/request', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body

  try {
    const requests = await User.Role.Request.find({ user_id })

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/:role', auth, async (req: Request, res: Response, next) => {
  const { auth, data } = req.body
  const { role } = req.params
  try {
    switch (role) {
      case 'student':
        permission(['student'], ['guest'])(req, res, next)
        await UserService.role.request.createStudent(auth.user_id, auth.roles, data)
        return res.status(200).send({ success: true, message: 'Student request sended!' })

      case 'professor':
        permission(['professor'], ['guest'])(req, res, next)
        await UserService.role.request.createProfessor(auth.user_id, auth.roles, data)
        return res.status(200).send({ success: true, message: 'Professor request sended!' })

      case 'moderator':
        permission(['moderator'], ['professor'])(req, res, next)
        await UserService.role.request.createModerator(auth.user_id, auth.roles, data)
        return res.status(200).send({ success: true, message: 'Moderator request sended!' })

      default:
        return res.status(403).send({ success: false, message: 'Role provided do not exists!' })
    }
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Request role')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/:role/:id', auth, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { auth, data } = req.body
  const { role } = req.params

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

Router.patch('/request/accept/:id', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    await UserService.role.request.accept(request_id)

    return res.status(200).send({ success: true, message: 'Accept complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Accept')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/reject/:id', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
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

Router.delete('/request/:id', auth, permission(['admin'], ['moderator']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    await UserService.role.request.delete(request_id)

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/request/voucher/:uuid', auth, async (req: Request, res: Response) => {
  const voucher_uuid = req.params.uuid

  try {
    new ValSchema(P.joi.string().required()).validate(voucher_uuid)

    const url = await File.get('documents', voucher_uuid)

    return res.status(200).send({ success: true, message: 'Fetch complete!', url })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
}) // Integrate with get request route

export default Router
