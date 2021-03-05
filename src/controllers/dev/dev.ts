import nodemailer from '../../services/nodemailer'
import ArisError from '../../utils/arisError'
import lucene from '../../services/lucene'
import logger from '../../services/logger'
import redis from '../../services/redis'
import User from '../../utils/user'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.use(auth, permission(['admin']))

Router.get('/reset-lucene', async (req: Request, res: Response) => {
  try {
    logger.info('Deleting lucene database...')

    if (!lucene.enabled) return res.status(200).send({ success: false, message: 'Lucene not enabled!' })

    await lucene.deleteAll()

    const users = await User.find({})
    for (const user of users) {
      const user_id = user.get('user_id')
      const name = user.get('full_name')
      const success = await lucene.add({ id: user_id, name: name })
      logger.info(`Adding user ${user_id} - ${name}: ${success}`)
    }

    return res.status(200).send({ success: true, message: 'Lucene database reseted!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Lucene error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/search-lucene', async (req: Request, res: Response) => {
  const { search } = req.query
  try {
    if (!lucene.enabled) return res.status(200).send({ success: false, message: 'Lucene not enabled!' })

    if (search !== null && search !== undefined) {
      const result = await lucene.search(search.toString(), 50)
      return res.status(200).send({ success: true, search, result })
    } else {
      return res.status(500).send({ success: false, message: 'Search is null!' })
    }
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Lucene error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/test-email', async (req: Request, res: Response) => {
  const { email } = req.query
  try {
    if (email !== null && email !== undefined) {
      await nodemailer.confirmEmail({ to: email.toString(), token: 'NONE' })
      return res.status(200).send({ success: true })
    } else {
      return res.status(500).send({ success: false, message: 'Email is null!' })
    }
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Email error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/reset-redis', async (req: Request, res: Response) => {
  try {
    logger.info('Deleting redis database...')

    await redis.client.flushallAsync()
    return res.status(200).send({ success: true })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Redis error')
    return res.status(result.status).send(result.send)
  }
})

export default Router
