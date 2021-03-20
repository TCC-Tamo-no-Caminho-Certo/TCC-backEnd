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
    const user_roles = await User.Role.find({ user_id })
    const remove_role = user_roles.find(role => role.get('role_id') === role_id)
    const new_role_list = user_roles.filter(role => role.get('role_id') !== role_id)

    if (!remove_role) throw new ArisError('Role not vinculated with this user!', 400)
    await remove_role.remove()

    await User.updateAccessTokenData(user_id, new_role_list.map(role => role.format()))

    return res.status(200).send({ success: true, message: 'Remove role complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Remove role')
    return res.status(result.status).send(result.send)
  }
})

export default Router
