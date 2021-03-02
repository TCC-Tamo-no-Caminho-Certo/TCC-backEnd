import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import File from '../../utils/minio'
import User from '../../utils/user'
import lucene from '../../services/lucene'
import logger from '../../services/logger'

import { auth } from '../../middlewares'

import express, { json, Request, Response } from 'express'
const Router = express.Router()
// Router.use(auth)

Router.route('/reset-lucene')
  .get(auth, async (req: Request, res: Response) => {
    try {
      logger.info('Deleting lucene database...')
      await lucene.deleteAll();
      const users = (await User.find({}) as User[])
      users.map(async user => {
        logger.info('Adding user: ' + JSON.stringify(user.format()))
        if (await lucene.add(user.get('user_id'), user.get('full_name'))) {
          logger.info('Ok')
        } else {
          logger.info('Error')
        }
      })

      return res.status(200).send({ success: true, message: 'Lucene database reseted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Lucene error')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
