import ArisError from '../../utils/arisError'
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
        let userId = user.get('user_id')
        let name = user.get('full_name')
        let succes = await lucene.add(userId, name)
        logger.info(`Adding user ${userId} - ${name}: ${succes}`)
      })

      return res.status(200).send({ success: true, message: 'Lucene database reseted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Lucene error')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
