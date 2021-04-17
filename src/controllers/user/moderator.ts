import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/moderator')
  .get(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id } = req.body

    try {
      const moderator = (await User.Role.Moderator.find({ user_id }))[0].format()

      return res.status(200).send({ success: true, message: 'Get moderator info complete!', moderator })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get moderator info')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, async (req: Request, res: Response) => {
    return res.send({ success: true, message: 'Route not complete!' })
  })

  .patch(auth, async (req: Request, res: Response) => {
    const { _user_id, password } = req.body

    try {
      return res.send({ success: true, message: 'Route not in use!' })
      new ValSchema({
        password: P.user.password.required()
      }).validate({ password })

      const [user] = await User.find({ user_id: _user_id })
      const [moderator] = await User.Role.Moderator.find({ user_id: _user_id })
      await user.verifyPassword(password)
      //await moderator.update({ lattes, linkedin, orcid, postgraduate })

      const response = moderator.format()

      return res.status(200).send({ success: true, message: 'Update complete!', moderator: response })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id, university_id, password } = req.body

    try {
      const [user] = await User.find({ user_id })
      const [moderator_course] = await User.Role.Moderator.find({ user_id, university_id })
      await user.verifyPassword(password)

      await moderator_course.remove()

      return res.status(200).send({ success: true, message: 'Remove complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Remove')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/moderator/:user_id').get(auth, async (req: Request, res: Response) => {
  const user_id = parseInt(req.params.user_id)

  try {
    new ValSchema(P.joi.number().positive()).validate(user_id)

    const moderator = (await User.Role.Moderator.find({ user_id }))[0].format()

    return res.status(200).send({ success: true, message: 'Get moderator info complete!', moderator })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get moderator info')
    return res.status(result.status).send(result.send)
  }
})

export default Router
