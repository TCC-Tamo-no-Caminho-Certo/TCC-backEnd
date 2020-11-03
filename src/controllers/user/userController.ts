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

route.post('/complete-register', async (req: Request, res: Response) => {
  const { _user_id, city, address, postal_code, phone, role } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { phone, role }

  try {
    Data.validate(address_info, 'address')
    Data.validate(user_info, 'complete_register')

    const user = await User.getUser(_user_id)
    const aris_user = await User.completeRegister(user, address_info, role, phone)
    UserUtils.logout(req)
    const access_token = UserUtils.generateAccessToken(aris_user)

    return res.status(200).send({ success: true, message: 'Register completed!', user: aris_user, access_token })
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

    const new_hash = new_password && await argon.hash(new_password)
    user.role === 'base user' ?
      await user.update({ name, surname, birthday, password: new_hash }) :
      await user.update({ name, surname, birthday, phone, password: new_hash, address_info })

    const response: any = { ...user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Update complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.get('/delete', async (req: Request, res: Response) => {
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
