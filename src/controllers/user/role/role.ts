import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import { auth } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/role').get()

Router.route('/role/:title').delete(auth, async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body
  const title = req.params.title

  try {
    new ValSchema(P.joi.string().equal('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator').required()).validate(title)

    const role_id = User.Role.Manage.find(<any>title).get('role_id')

    const user_roles = await User.Role.find({ user_id })
    const remove_role = user_roles.find(role => role.get('role_id') === role_id)
    const new_role_list = user_roles.filter(role => role.get('role_id') !== role_id)
    if (new_role_list.length === 0) {
      const guest = await User.Role.add(user_id, 'guest')
      new_role_list.push(guest)
    }

    if (!remove_role) throw new ArisError('Role not vinculated with this user!', 400)
    await remove_role.remove()

    if (remove_role.get('title') === 'student') {
      const [student] = await User.Role.Student.find({ user_id })
      await student.delete()
      const vinculated_courses = await User.Role.Student.Course.find({ user_id })
      for (const course of vinculated_courses) await course.remove()
    } else if (remove_role.get('title') === 'professor') {
      const [professor] = await User.Role.Professor.find({ user_id })
      await professor.delete()
      const vinculated_courses = await User.Role.Professor.Course.find({ user_id })
      for (const course of vinculated_courses) await course.remove()
    }

    await User.updateAccessTokenData(
      user_id,
      new_role_list.map(role => role.format())
    )

    return res.status(200).send({ success: true, message: 'Remove role complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Remove role')
    return res.status(result.status).send(result.send)
  }
})

export default Router
