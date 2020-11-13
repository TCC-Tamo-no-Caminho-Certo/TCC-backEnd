import RoleReq from '../../models/request/roleReqModel'
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
    await user.update({ avatar: uuid })

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

route.post('/complete-register', async (req: Request, res: Response) => {
  const { _user_id, city, address, postal_code, phone, role, form_data } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { phone, role }
  const data = JSON.stringify(form_data)

  try {
    Data.validate(address_info, 'address')
    Data.validate(user_info, 'complete_register')
    if (!data) throw new ArisError('Form data not provided!', 403) // CREATE VALIDATION

    const user = await User.getUser(_user_id)
    if (!user.roles.some(role => role === 'base user')) throw new ArisError('This account isn`t of type base user!', 403)

    const { role_id } = await Role.getRole(role)

    const aris_user = new User({ ...user })
    await aris_user.update({ phone, role: 'aris user', address_info })

    const request = new RoleReq({ user_id: aris_user.user_id, role_id, data, status: 'awaiting' })
    await request.insert()

    UserUtils.logout(req)
    const access_token = UserUtils.generateAccessToken(aris_user)

    const response: any = { ...aris_user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Register completed!', user: response, access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Complete register')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update', async (req: Request, res: Response) => {
  const { _user_id, name, surname, birthday, phone, password, new_password, city, address, postal_code } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { name, surname, birthday, phone, password, new_password }

  try {
    Data.validate(user_info, 'user_patch')
    Data.validate(address_info, 'user_patch_address')

    const user = await User.getUser(_user_id)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)

    const new_hash = new_password && (await argon.hash(new_password))
    user.roles.some(role => role === 'base user')
      ? await user.update({ name, surname, birthday, password: new_hash })
      : await user.update({ name, surname, birthday, phone, password: new_hash, address_info })

    const response: any = { ...user }
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
