import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/student')
  .get(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id } = req.body

    try {
      const student = (await User.Role.Student.find({ user_id }))[0].format()

      return res.status(200).send({ success: true, message: 'Get student info complete!', student })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get student info')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, async (req: Request, res: Response) => {
    return res.send({ success: true, message: 'Route not complete!' })
  })

  .patch(auth, async (req: Request, res: Response) => {
    const { _user_id, lattes, linkedin, orcid, postgraduate, password } = req.body

    try {
      new ValSchema({
        lattes: P.joi.string().allow(null),
        linkedin: P.joi.string().allow(null),
        password: P.user.password.required()
      }).validate({ lattes, linkedin, password })

      const [user] = await User.find({ user_id: _user_id })
      const [student] = await User.Role.Student.find({ user_id: _user_id })
      await user.verifyPassword(password)
      await student.update({ lattes, linkedin })

      const response = student.format()

      return res.status(200).send({ success: true, message: 'Update complete!', student: response })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id, university_id, password } = req.body

    try {
      const [user] = await User.find({ user_id })
      const [student_course] = await User.Role.Student.Course.find({ user_id, university_id })
      await user.verifyPassword(password)

      await student_course.remove()

      return res.status(200).send({ success: true, message: 'Remove complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Remove')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/student/:user_id').get(auth, async (req: Request, res: Response) => {
  const user_id = parseInt(req.params.user_id)

  try {
    new ValSchema(P.joi.number().positive()).validate(user_id)

    const student = (await User.Role.Student.find({ user_id }))[0].format()

    return res.status(200).send({ success: true, message: 'Get student info complete!', student })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get student info')
    return res.status(result.status).send(result.send)
  }
})

export default Router
