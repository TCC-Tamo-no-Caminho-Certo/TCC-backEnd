import RoleReq from '../../models/request/roleReqModel'
import permission from '../../middlewares/permission'
import ValSchema, { P } from '../../utils/validation'
import Role from '../../models/user/roleModel'
import User from '../../models/user/userModel'
import ArisError from '../../utils/arisError'
import UserUtils from '../../utils/user'
import File from '../../utils/minio'
import argon from 'argon2'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get', async (req: Request, res: Response) => {
  const { _user_id } = req.body

  try {
    const user = await User.getUser(_user_id)

    const response: Partial<User>= { ...user }
    delete response.password

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
    const uuid = await file.update('profile', 'image/png', user.avatar)
    user.avatar = uuid

    await user.update()

    return res.status(200).send({ success: true, message: 'Avatar uploaded!', object: uuid })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

route.post('/request-role', permission(['guest'], true), async (req: Request, res: Response) => {
  const { _user_id, role, form_data } = req.body
  const data = JSON.stringify(form_data)

  try {
    new ValSchema(P.user.role.equal('professor', 'student').required()).validate(role)
    if (!data) throw new ArisError('Form data not provided!', 400)

    if (await RoleReq.exist(_user_id, role)) throw new ArisError('Request already exists!', 400)

    const { role_id } = await Role.getRole(role)

    const request = new RoleReq({ user_id: _user_id, role_id, data, status: 'awaiting' })
    await request.insert()

    return res.status(200).send({ success: true, message: 'Add role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Add Role')
    return res.status(result.status).send(result.send)
  }
}) // CREATE VALIDATION

route.post('/complete-register', permission(['guest']), async (req: Request, res: Response) => {
  const { _user_id, cpf, phone, role, form_data } = req.body
  const user_info = { cpf, phone, role }
  const data = JSON.stringify(form_data)

  try {
    new ValSchema({
      cpf: P.user.cpf.required(),
      phone: P.user.phone.allow(null),
      role: P.user.role.equal('professor', 'student').required()
    }).validate(user_info)
    if (!data) throw new ArisError('Form data not provided!', 400)

    if (await RoleReq.exist(_user_id, role)) throw new ArisError('Request already exists!', 400)

    const user = await User.getUser(_user_id)
    const { role_id } = await Role.getRole(role)

    const aris_user = new User({ ...user, cpf, phone })
    await aris_user.update()
    await aris_user.updateRole('guest', 'aris')

    const request = new RoleReq({ user_id: aris_user.user_id, role_id, data, status: 'awaiting' })
    await request.insert()

    const response: any = { ...aris_user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Register completed and request sended!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Complete register')
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
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 400)

    const new_hash = new_password && (await argon.hash(new_password))

    if (name) user.name = name
    if (surname) user.surname = surname
    if (birthday) user.birthday = birthday
    if (new_hash) user.password = new_hash

    if (typeof user === typeof User) if (phone) (user as User).phone = phone

    await user.update()

    const response: Partial<User> = { ...user }
    delete response.password

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
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 400)
    await user.delete()
    UserUtils.logout(req)

    return res.status(200).send({ success: true, message: 'Delete complete!', user })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
