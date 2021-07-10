import UserService from '../../services/user'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/user')
  .get(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id }
    } = req.body

    try {
      const user = (await User.find({ user_id }))[0].format()
      const roles = (await User.Role.find({ user_id })).map(role => role.format())
      const emails = (await User.Email.find({ user_id })).map(email => email.format())

      let moderator: any
      let professor: any
      let student: any
      for (const role of roles) {
        if (role === 'professor') {
          professor = (await User.Role.Professor.find({ user_id }))[0].format()
          const universities = (await User.Role.Professor.Course.find({ user_id })).map(university => university.format())

          professor.universities = universities
        } else if (role === 'student') {
          student = (await User.Role.Student.find({ user_id }))[0].format()
          const universities = (await User.Role.Student.Course.find({ user_id })).map(university => university.format())

          student.universities = universities
        } else if (role === 'moderator') {
          moderator = {}
          moderator.universities = (await User.Role.Moderator.find({ user_id })).map(university => university.format())
        }
      }

      const response = { ...user, roles, emails, moderator, professor, student }

      return res.status(200).send({ success: true, message: 'Get user info complete!', user: response })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get user info')
      return res.status(result.status).send(result.send)
    }
  })

  .patch(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data,
      data: { password }
    } = req.body

    try {
      const user = await UserService.update({ id: user_id }, data, password)

      return res.status(200).send({ success: true, message: 'Update complete!', user })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const {
      auth: { user_id },
      data: { password }
    } = req.body
    const auth = req.headers.authorization!

    try {
      await UserService.delete({ id: user_id }, password, auth)

      return res.status(200).send({ success: true, message: 'Delete complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete')
      return res.status(result.status).send(result.send)
    }
  })

Router.put('/user/avatar', auth, async (req: Request, res: Response) => {
  const {
    auth: { user_id },
    data: { picture }
  } = req.body

  try {
    const avatar_uuid = await UserService.updateAvatar({ id: user_id }, picture)

    return res.status(200).send({ success: true, message: 'Avatar uploaded!', avatar_uuid })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

export default Router
