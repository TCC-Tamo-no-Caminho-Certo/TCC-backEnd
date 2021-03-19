import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/requests', async (req: Request, res: Response) => {
  const { page, per_page, filter } = req.query

  type Filter = Parameters<typeof User.Role.Request.find>[0]
  type FilterWithName = Filter & { full_name?: string | string[] }

  try {
    new ValSchema({
      page: P.joi.number().positive(),
      per_page: P.joi.number().min(1).max(100),
      filter: P.joi.object({
        full_name: P.filter.string.allow(null),
        request_id: P.filter.ids.allow(null),
        user_id: P.filter.ids.allow(null),
        role_id: P.filter.ids.allow(null),
        status: P.filter.string.allow(null),
        created_at: P.filter.date.allow(null),
        updated_at: P.filter.date.allow(null)
      })
    }).validate({ page, per_page, filter })
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

    const users: User[] = []
    const user_ids: number[] = []
    if ((<FilterWithName>filter).full_name) {
      users.push(...(await User.find({ full_name: (<FilterWithName>filter).full_name }, pagination)))
      user_ids.push(...users.map(user => user.get('user_id')))
      if (Array.isArray((<FilterWithName>filter).user_id)) (<number[]>(<FilterWithName>filter).user_id).push(...user_ids)
      else if ((<FilterWithName>filter).user_id) (<FilterWithName>filter).user_id = [<number>(<FilterWithName>filter).user_id].push(...user_ids)
      else (<FilterWithName>filter).user_id = user_ids[0] ? user_ids : undefined
      delete (<FilterWithName>filter).full_name
    }

    const requests = await User.Role.Request.find(<Filter>filter, pagination)
    const new_user_ids = requests.map(request => request.get('user_id'))
    const roles = requests.map(request => ({ user_id: request.get('user_id'), role_id: request.get('role_id') }))

    users.push(...(await User.find({ user_id: new_user_ids.slice(user_ids.length) })))

    const result = requests.map(request => {
      const request_info: any = request.format()
      const name = users.find(user => user.get('user_id') === request.get('user_id'))!.get('full_name')
      const role = User.Role.Manage.find(roles.find(role => role.user_id === request.get('user_id'))!.role_id).get('title')

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
