import BaseUser from '../models/user/baseUserModel'
import ArisError from '../utils/arisError'
import redis from '../services/redis'
import Data from '../utils/data'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/confirm-register/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  try {
    Data.validate({ token }, 'token')

    const reply = await redis.client.getAsync(`register.${token}`)
    if (!reply) {
      res.redirect('/')
      return;
    } //throw new ArisError('Invalid token!', 403)
    const user_info = JSON.parse(reply)

    const user = new BaseUser(user_info)
    await user.insert()
    //const access_token = UserUtils.generateAccessToken(user)

    redis.client.del(`register.${token}`)

    //return res.status(200).send({ success: true, message: 'Register complete!', access_token })
    res.redirect('/')
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Confirm registration')
    return res.status(result.status).send(result.send)
  }
})

export default route