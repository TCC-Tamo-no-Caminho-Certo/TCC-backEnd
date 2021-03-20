import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import { auth } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/role').get()

Router.route('/role/:id').delete(auth, async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body
  const role_id = parseInt(req.params.id)

  try {
    const [user_role] = await User.Role.find({ user_id, role_id })
    if (!user_role) throw new ArisError('Role not vinculated with this user!', 400)
    await user_role.remove()

    return res.status(200).send({ success: true, message: 'Remove role complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Remove role')
    return res.status(result.status).send(result.send)
  }
})

export default Router
