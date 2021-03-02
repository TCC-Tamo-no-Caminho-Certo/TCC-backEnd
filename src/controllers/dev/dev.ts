import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import File from '../../utils/minio'
import User from '../../utils/user'
import lucene from '../../services/lucene'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()
// Router.use(auth)

Router.route('/reset-lucene')
  .get(auth, async (req: Request, res: Response) => {
    try {
      await lucene.deleteAll();
      const users = (await User.find({}) as User[])
      users.map(async user => {
        await lucene.add(user.get('user_id'), user.get('full_name'));
      })

      return res.status(200).send({ success: true, message: 'Lucene database reseted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Lucene error')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
