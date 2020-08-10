import { generateAccessToken, logout } from '../../utils'
import ArisError from '../../models/arisErrorModel'
import User from '../../models/user/userModel'
import Data from '../../models/dataModel'

import express, { Request, Response } from 'express'
const route = express.Router()

route.post('/complete-register', async (req: Request, res: Response) => {
  const { _user_id, city, address, postal_code, phone, role } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { phone, role }

  try {
    Data.validate(address_info, 'address')
    Data.validate(user_info, 'complete_user_register')

    const user = await User.getUser(_user_id)
    const aris_user = await User.completeRegister(user, address_info, role, phone)
    logout(req)
    const access_token = generateAccessToken(aris_user)

    return res.status(200).send({ success: true, message: 'Complete register authorized!', user: aris_user, access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Complete register')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update', async (req: Request, res: Response) => {
  const { _user_id, name, surname, phone, city, address, postal_code } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { name, surname, phone }

  try {
    Data.validate(user_info, 'user_patch')
    Data.validate(address_info, 'user_patch_address')

    const user = await User.getUser(_user_id)
    await user.update({ name, surname, phone, address_info })

    return res.status(200).send({ success: true, message: 'Update authorized!', user })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

export default route
