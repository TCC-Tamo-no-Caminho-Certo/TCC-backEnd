import RoleReq from '../../database/models/request/roleReq'
import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import express, { Request, Response } from 'express'
const route = express.Router()

route.post('/get/:page/:limit', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const limit = parseInt(req.params.limit)
  const { ids, roles, name, status, created_at, updated_at } = req.body
  const filters = {
    ids,
    roles,
    name,
    status,
    created_at,
    updated_at
  }

  try {
    if (page <= 0) throw new ArisError('Invalid page number', 400)
    if (limit <= 0) throw new ArisError('Invalid limit number', 400)
    new ValSchema({
      ids: P.filter.ids.allow(null),
      roles: P.filter.string.allow(null),
      name: P.user.name.allow(null),
      status: P.filter.string.allow(null),
      created_at: P.filter.date.allow(null),
      updated_at: P.filter.date.allow(null)
    }).validate(filters)

    const requests = await RoleReq.getAll(filters, page, limit)

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

route.post('/accept/:id', async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    const request = await RoleReq.get(request_id)
    const user = await User.getUser(request.user_id)

    request.status = 'accepted'
    await request.update()
    user.get('roles').some(role => role === 'guest') ? await user.updateRole('guest', request.role_id) : await user.addRole(request.role_id)

    await user.updateAccessTokenData()

    return res.status(200).send({ success: true, message: 'Accept complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Accept')
    return res.status(result.status).send(result.send)
  }
})

route.post('/reject/:id', async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    const request = await RoleReq.get(request_id)
    const user = await User.getUser(request.user_id)

    request.status = 'rejected'
    await request.update()
    await user.removeRole(request.role_id)

    await user.updateAccessTokenData()

    return res.status(200).send({ success: true, message: 'Reject complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Reject')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete/:id', async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    const request = await RoleReq.get(request_id)
    await request.delete()

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route