import User from '../../models/user/userModel'
import ArisError from '../../utils/arisError'
import minio from '../../services/minio'
import UserUtils from '../../utils/user'
import Data from '../../utils/data'
import argon from 'argon2'
import Jimp from 'jimp'
import { v4 as uuidv4 } from 'uuid'

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

    let stringData = picture.split(",", 2);
    if (stringData.length == 2 && stringData[0] === "data:image/png;base64") {
        let dataBuffer = Buffer.from(stringData[1], "base64");
        let image = await Jimp.read(dataBuffer);
        let buffer = await image.resize(512, 512).getBufferAsync(Jimp.MIME_PNG);
        var objectUuid = uuidv4();
        await minio.client.putObject("profile", objectUuid, buffer, buffer.length, {
          'Content-Type': 'image/png',
        });
        var oldAvatarUuid = user.avatar;
        await user.update({ avatar: objectUuid })
        if(oldAvatarUuid !== "default") await minio.client.removeObject("profile", oldAvatarUuid);
        return res.status(200).send({ success: true, object: objectUuid })
    } else {
      return res.status(400).send({ success: false, message: "Failed to decode data." })
    }
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

    return res.status(200).send({ success: true, message: 'Complete register complete!', user: aris_user, access_token })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Complete register')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update', async (req: Request, res: Response) => {
  const { _user_id, name, surname, phone, password, new_password, city, address, postal_code } = req.body
  const address_info = { city, address, postal_code }
  const user_info = { name, surname, phone, password, new_password }

  try {
    Data.validate(user_info, 'user_patch')
    Data.validate(address_info, 'user_patch_address')

    const user = await User.getUser(_user_id)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 403)

    const new_hash = await argon.hash(new_password)
    await user.update({ name, surname, phone, password: new_hash, address_info })

    const response: any = { ...user }
    delete response.password

    return res.status(200).send({ success: true, message: 'Update complete!', user: response })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.get('/delete', async (req: Request, res: Response) => {
  const { _user_id } = req.body

  try {
    const user = await User.getUser(_user_id)
    await user.delete()
    UserUtils.logout(req)

    return res.status(200).send({ success: true, message: 'Delete complete!', user })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
