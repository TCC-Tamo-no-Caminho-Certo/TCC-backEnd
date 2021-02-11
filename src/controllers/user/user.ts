import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import File from '../../utils/minio'
import User from '../../utils/user'

// PASS ROLEREQ INTO USER MODEL

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get', async (req: Request, res: Response) => {
  const { _user_id } = req.body

  try {
    const user = await User.getUser(_user_id)
    const response = user.format()

    return res.status(200).send({ success: true, message: 'Get user info complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get user info')
    return res.status(result.status).send(result.send)
  }
})

route.post('/get/:page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const { ids, name, created_at, updated_at } = req.body
  const filters = {
    ids,
    name,
    created_at,
    updated_at
  }

  try {
    if (page <= 0) throw new ArisError('Invalid page number', 400)
    new ValSchema({
      ids: P.filter.ids.allow(null),
      name: P.user.name.allow(null),
      created_at: P.filter.date.allow(null),
      updated_at: P.filter.date.allow(null)
    }).validate(filters)

    const users = await User.getAllUsers(filters, page)

    return res.status(200).send({ success: true, message: 'Get users info complete!', users })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get users info')
    return res.status(result.status).send(result.send)
  }
})

route.post('/avatar/upload', async (req: Request, res: Response) => {
  const { _user_id, picture } = req.body

  try {
    const user = await User.getUser(_user_id)

    const file = new File(picture)
    if (!file.validateTypes(['data:image/png;base64'])) throw new ArisError('Invalid file Type!', 400)
    const uuid = await file.update('profile', 'image/png', user.get('avatar'))

    await user.updateUser({ avatar: uuid })

    return res.status(200).send({ success: true, message: 'Avatar uploaded!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

route.post('/request-role', async (req: Request, res: Response) => {
  const { _user_id, role, ...form_data } = req.body
  const data = JSON.stringify(form_data)

  try {
    new ValSchema(P.user.role.equal('professor', 'student').required()).validate(role)
    if (!data) throw new ArisError('Form data not provided!', 400)

    const user = await User.getUser(_user_id)
    await user.requestRole(role, form_data)

    return res.status(200).send({ success: true, message: 'Add role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Add Role')
    return res.status(result.status).send(result.send)
  }
}) // CREATE VALIDATION

route.post('/update', async (req: Request, res: Response) => {
  const { _user_id, name, surname, birthday, phone, password, new_password } = req.body
  const user_info = { name, surname, birthday, phone, password, new_password }

  try {
    new ValSchema({
      name: P.user.name.allow(null),
      surname: P.user.surname.allow(null),
      birthday: P.user.birthday.allow(null),
      phone: P.user.phone.allow(null),
      new_password: P.user.password.allow(null),
      password: P.user.password.required()
    }).validate(user_info)

    const user = await User.getUser(_user_id)
    await user.verifyPassword(password)
    await user.updateUser({ name, surname, birthday, phone, password: new_password })

    const response = user.format()

    return res.status(200).send({ success: true, message: 'Update complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete', async (req: Request, res: Response) => {
  const { _user_id, password } = req.body

  try {
    const user = await User.getUser(_user_id)
    await user.verifyPassword(password)
    await user.deleteUser()
    await User.deleteAccessToken(req, true)

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
