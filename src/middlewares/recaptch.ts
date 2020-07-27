import { Request, Response, NextFunction } from 'express'
import axios from 'axios'

export default async function (req: Request, res: Response, next: NextFunction) {
  const secret = '6LfC97YZAAAAAEudTUK19SsFnK7Ny5pADwvX_M7Z'

  if (!req.body.captcha)
    return res.status(403).send({ Success: false, Message: 'No captcha token provided!' })

  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${req.body.captcha}`
  const { data } = await axios.post(url)

  console.log(data)

  if (!data.success)
    return res.status(403).send({ Success: false, Message: 'You might be a robot, sorry!', Score: data.score })

  next()
}