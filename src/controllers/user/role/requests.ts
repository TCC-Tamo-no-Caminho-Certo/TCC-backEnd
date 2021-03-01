import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/requests/:page/:per_page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const per_page = parseInt(req.params.per_page)
  const { request_id, user_id, role_id, status, created_at, updated_at } = req.body
  const filters = {
    request_id,
    user_id,
    role_id,
    status,
    created_at,
    updated_at
  }

  try {
    if (page <= 0) throw new ArisError('Invalid page number', 400)
    if (per_page <= 0) throw new ArisError('Invalid limit number', 400)
    new ValSchema({
      request_id: P.filter.ids.allow(null),
      user_id: P.filter.number.allow(null),
      role_id: P.filter.number.allow(null),
      status: P.filter.string.allow(null),
      created_at: P.filter.date.allow(null),
      updated_at: P.filter.date.allow(null)
    }).validate(filters)

    const requests = await User.Role.Request.find(filters, { page, per_page })

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

export default route
