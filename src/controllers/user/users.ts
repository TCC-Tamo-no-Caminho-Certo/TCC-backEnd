import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/users', async (req: Request, res: Response) => {
  const { page, per_page, filter } = req.query

  type Filter = Parameters<typeof User.find>[0]

  try {
    new ValSchema({
      page: P.joi.number().positive(),
      per_page: P.joi.number().min(1).max(100),
      filter: P.joi.object({
        user_id: P.filter.ids.allow(null),
        phone: P.filter.string.allow(null),
        birthday: P.filter.string.allow(null),
        full_name: P.filter.string.allow(null),
        created_at: P.filter.date.allow(null),
        updated_at: P.filter.date.allow(null)
      })
    }).validate({ page, per_page, filter })
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

    const users = await User.find(<Filter>filter, pagination)
    if (!users) return res.status(200).send({ success: true, message: 'Get users complete!', users: 'No user found!' })
    const ids = users.map(user => user.get('user_id'))
    const emails = await User.Email.find({ user_id: ids })
    const roles = await User.Role.find({ user_id: ids })

    const result = users.map(user => {
      const user_info: any = user.format()
      const email_info = emails.filter(email => email.get('user_id') === user.get('user_id')).map(email => email.format())
      const role_info = roles.filter(role => role.get('user_id') === user.get('user_id')).map(role => role.format())

      user_info.emails = email_info
      user_info.roles = role_info

      return user_info
    })

    return res.status(200).send({ success: true, message: 'Get users complete!', users: result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get users info')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/users/:user_id', async (req: Request, res: Response) => {
  const user_id = parseInt(req.params.user_id)

  try {
    new ValSchema(P.joi.number().positive()).validate(user_id)

    const [user] = await User.find({ user_id })
    if (!user) return res.status(200).send({ success: true, message: 'Get users complete!', users: 'No user found!' })
    const emails = await User.Email.find({ user_id })
    const roles = await User.Role.find({ user_id })

    const result: any = user.format()
    result.emails = emails.filter(email => email.get('user_id') === user.get('user_id')).map(email => email.format())
    result.roles = roles.filter(role => role.get('user_id') === user.get('user_id')).map(role => role.format())

    return res.status(200).send({ success: true, message: 'Get users complete!', users: result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get users info')
    return res.status(result.status).send(result.send)
  }
})

export default Router
