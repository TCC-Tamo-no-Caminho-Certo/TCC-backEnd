import RoleReq from '../../models/request/roleReqModel'
import permission from '../../middlewares/permission'
import Role from '../../models/user/roleModel'
import User from '../../models/user/userModel'
import ArisError from '../../utils/arisError'
import UserUtils from '../../utils/user'
import File from '../../utils/minio'
import Data from '../../utils/data'
import argon from 'argon2'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get', async (req: Request, res: Response) => {
  const { _user_id } = req.body

  try {
    const user = await User.getUser(_user_id)

    const response: any = { ...user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Get user info complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get user info')
    return res.status(result.status).send(result.send)
  }
})

route.post('/avatar/upload', async (req: Request, res: Response) => {
  const { _user_id, picture } = req.body

  try {
    const user = await User.getUser(_user_id)

    const file = new File(picture)
    if (!file.validateTypes(['data:image/png;base64'])) throw new ArisError('Invalid file Type!', 403)
    const uuid = await file.update('profile', 'image/png', user.avatar)
    user.avatar = uuid

    await user.update()

    return res.status(200).send({ success: true, message: 'Avatar uploaded!', object: uuid })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

route.post('/request-role', async (req: Request, res: Response) => {
  const { _user_id, role, form_data } = req.body
  const data = JSON.stringify(form_data)

  try {
    if (!data) throw new ArisError('Form data not provided!', 403) // CREATE VALIDATION

    const { role_id } = await Role.getRole(role)

    const request = new RoleReq({ user_id: _user_id, role_id, data, status: 'awaiting' })
    await request.insert()

    return res.status(200).send({ success: true, message: 'Add role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Add Role')
    return res.status(result.status).send(result.send)
  }
})

route.post('/complete-register', permission(['base user']), async (req: Request, res: Response) => {
  const { _user_id, cpf, phone, role, form_data } = req.body
  const user_info = { cpf, phone, role }
  const data = JSON.stringify(form_data)

  try {
    Data.validate(user_info, 'complete_register')
    if (!data) throw new ArisError('Form data not provided!', 403) // CREATE VALIDATION

    const user = await User.getUser(_user_id)
    const { role_id } = await Role.getRole(role)

    const aris_user = new User({ ...user, cpf, phone })
    await aris_user.update()
    await aris_user.updateRole('aris user', 'base user')

    const request = new RoleReq({ user_id: aris_user.user_id, role_id, data, status: 'awaiting' })
    await request.insert()

    const response: any = { ...aris_user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Register completed and request sended!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Complete register')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update', async (req: Request, res: Response) => {
  const { _user_id, name, surname, birthday, phone, password, new_password } = req.body
  const user_info = { name, surname, birthday, phone, password, new_password }

  try {
    Data.validate(user_info, 'user_patch')

    const user: any = await User.getUser(_user_id)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)

    const new_hash = new_password && (await argon.hash(new_password))

    if (name) user.name = name
    if (surname) user.surname = surname
    if (birthday) user.birthday = birthday
    if (new_hash) user.password = new_hash

    if (typeof user === typeof User) if (phone) user.phone = phone

    await user.update()

    const response: any = { ...user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Update complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})
// Improve
route.post('/delete', async (req: Request, res: Response) => {
  const { _user_id, password } = req.body

  try {
    const user = await User.getUser(_user_id)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)
    await user.delete()
    UserUtils.logout(req)

    return res.status(200).send({ success: true, message: 'Delete complete!', user })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
