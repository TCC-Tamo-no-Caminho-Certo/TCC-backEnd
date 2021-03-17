import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/requests', async (req: Request, res: Response) => {
  const { page, per_page, filter } = req.query

  try {
    new ValSchema({
      page: P.joi.number().positive(),
      per_page: P.joi.number().min(1).max(100),
      filter: P.joi.object({
        request_id: P.filter.ids.allow(null),
        user_id: P.filter.ids.allow(null),
        role_id: P.filter.ids.allow(null),
        status: P.filter.string.allow(null),
        created_at: P.filter.date.allow(null),
        updated_at: P.filter.date.allow(null)
      })
    }).validate({ page, per_page, filter })
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

    const requests = await User.Role.Request.find(<any>filter, pagination)
    const user_ids = requests.map(request => request.get('user_id'))
    
    const users = await User.find({ user_id: user_ids })
    const roles = await User.Role.find({ user_id: user_ids })

    const result = requests.map(request => {
      const request_info: any = request.format()
      const name = users.find(user => user.get('user_id') === request.get('user_id'))!.get('full_name')
      const role = roles.find(role => role.get('user_id') === request.get('user_id'))!.get('title')

      request_info.name = name
      request_info.role = role

      return request_info
    })

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests: result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

export default route
