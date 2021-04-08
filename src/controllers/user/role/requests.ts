import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import { auth, permission } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/requests', auth, permission(['moderator']), async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body
  const { page, per_page, filter } = req.query

  type Filter = Parameters<typeof User.Role.Request.find>[0] & { full_name?: string | string[] }

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

    const universities_ids = (await User.Role.Moderator.find({ user_id })).map(vinc => vinc.get('university_id'))

    const users: User[] = []
    const user_ids: number[] = []
    if ((<Filter>filter)?.full_name) {
      users.push(...(await User.find({ full_name: (<Filter>filter).full_name }, pagination)))
      user_ids.push(...users.map(user => user.get('user_id')))

      if (Array.isArray((<Filter>filter).user_id)) (<number[]>(<Filter>filter).user_id).push(...user_ids)
      else if ((<Filter>filter).user_id) (<Filter>filter).user_id = [<number>(<Filter>filter).user_id, ...user_ids]
      else (<Filter>filter).user_id = user_ids[0] ? user_ids : undefined

      delete (<Filter>filter).full_name
    }

    const requests = await User.Role.Request.find({ ...(<Filter>filter), data: { university_id: universities_ids } }, pagination)
    const new_user_ids = requests.map(request => request.get('user_id'))

    users.push(...(await User.find({ user_id: new_user_ids.filter(new_user_id => !user_ids.some(user_id => user_id === new_user_id)) })))

    const result = requests.map(request => {
      const request_info: any = request.format()
      const name = users.find(user => user.get('user_id') === request.get('user_id'))!.get('full_name')

      request_info.name = name

      return request_info
    })

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests: result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

export default Router
