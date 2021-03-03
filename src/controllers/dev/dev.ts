import ArisError from '../../utils/arisError'
import lucene from '../../services/lucene'
import logger from '../../services/logger'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()
// Router.use(auth)

Router.get('/reset-lucene', auth, async (req: Request, res: Response) => {
  try {
    logger.info('Deleting lucene database...')

    await lucene.deleteAll()

    const users = await User.find({})
    for (const user of users) {
      const user_id = user.get('user_id')
      const name = user.get('full_name')
      const success = await lucene.add(user_id, name)
      logger.info(`Adding user ${user_id} - ${name}: ${success}`)
    }

    return res.status(200).send({ success: true, message: 'Lucene database reseted!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Lucene error')
    return res.status(result.status).send(result.send)
  }
})

export default Router
