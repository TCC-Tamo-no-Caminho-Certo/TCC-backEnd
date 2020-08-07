import { Request, Response, NextFunction } from 'express'
import config from '../config'
import axios from 'axios'

export default config.captcha.use
  ? async (req: Request, res: Response, next: NextFunction) => {
      const secret = config.captcha.key

      if (!req.body.captcha) return res.status(403).send({ success: false, message: 'No captcha token provided!' })

      const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${req.body.captcha}`
      const { data } = await axios.post(url)

      if (!data.success) return res.status(403).send({ success: false, message: 'You might be a robot, sorry!', score: data.score })

      next()
    }
  : (req: Request, res: Response, next: NextFunction) => {
      next()
    }
