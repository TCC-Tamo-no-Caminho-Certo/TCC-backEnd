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

Router.get('/lucene-reset', async (req: Request, res: Response) => {
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

Router.get('/lucene-create-database', async (req: Request, res: Response) => {
  try {
    if (!lucene.enabled) return res.status(200).send({ success: false, message: 'Lucene not enabled!' })

    const result = await lucene.createDatabase()
    return res.status(200).send({ success: true, result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Lucene error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/lucene-get-databases', async (req: Request, res: Response) => {
  try {
    if (!lucene.enabled) return res.status(200).send({ success: false, message: 'Lucene not enabled!' })

    const result = await lucene.getDatabases()
    return res.status(200).send({ success: true, result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Lucene error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/lucene-search', async (req: Request, res: Response) => {
  const { search, from, to } = req.query
  try {
    if (!lucene.enabled) return res.status(200).send({ success: false, message: 'Lucene not enabled!' })

    if (search) {
      const result = await lucene.search(search.toString(), parseInt(<string> from), parseInt(<string> to))
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

Router.get('/redis/reset', async (req: Request, res: Response) => {
  try {
    logger.info('Deleting redis database...')

    const message = await redis.client.flushallAsync()
    return res.status(200).send({ success: true, message })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Redis error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/redis/keys', async (req: Request, res: Response) => {
  try {
    const result = await redis.client.keysAsync('*')
    return res.status(200).send({ success: true, result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Redis error')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/redis/:key', async (req: Request, res: Response) => {
  const { key } = req.params
  try {
    const result = await redis.client.getAsync(key)
    return res.status(200).send({ success: true, result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Redis error')
    return res.status(result.status).send(result.send)
  }
})

Router.delete('/redis/:key', async (req: Request, res: Response) => {
  const { key } = req.params
  try {
    const result = await redis.client.delAsync(key)
    return res.status(200).send({ success: true, result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Redis error')
    return res.status(result.status).send(result.send)
  }
})

export default Router
