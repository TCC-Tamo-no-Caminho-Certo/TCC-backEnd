import University from '../../utils/university'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/role', auth, async (req: Request, res: Response) => {
  try {
    const roles = User.Role.Manage.findAll().map(role => role.format())

    return res.status(200).send({ success: true, message: 'Fetch roles complete!', roles })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch roles')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/course', auth, async (req: Request, res: Response) => {
  try {
    const courses = University.Campus.Course.Manage.findAll().map(role => role.format())

    return res.status(200).send({ success: true, message: 'Fetch courses complete!', courses })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch courses')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/university', auth, async (req: Request, res: Response) => {
  try {
    const universities = (await University.find({})).map(university => university.format())

    return res.status(200).send({ success: true, message: 'Fetch universities complete!', universities })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch universities')
    return res.status(result.status).send(result.send)
  }
})

export default Router
