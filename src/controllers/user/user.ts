import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import Picture from '../../utils/jimp'
import File from '../../utils/minio'
import User from '../../utils/user'

import { auth } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/user')
  .get(auth, async (req: Request, res: Response) => {
    const { _user_id: user_id } = req.body

    try {
      const user = (await User.find({ user_id }))[0].format()
      const roles = (await User.Role.find({ user_id })).map(role => role.format())
      const emails = (await User.Email.find({ user_id })).map(email => email.format())
      const response = { ...user, roles, emails }

      return res.status(200).send({ success: true, message: 'Get user info complete!', user: response })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get user info')
      return res.status(result.status).send(result.send)
    }
  })

  .patch(auth, async (req: Request, res: Response) => {
    const { _user_id, name, surname, birthday, phone, password, new_password } = req.body
    const user_info = { name, surname, birthday, phone, password, new_password }

    try {
      new ValSchema({
        name: P.user.name.allow(null),
        surname: P.user.surname.allow(null),
        birthday: P.user.birthday.allow(null),
        phone: P.user.phone.allow(null),
        new_password: P.user.password.allow(null),
        password: P.user.password.required()
      }).validate(user_info)

      const [user] = await User.find({ user_id: _user_id })
      await user.verifyPassword(password)
      await user.update({ name, surname, birthday, phone, password: new_password })

      const response = user.format()

      return res.status(200).send({ success: true, message: 'Update complete!', user: response })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, async (req: Request, res: Response) => {
    const { _user_id, password } = req.body

    try {
      const [user] = await User.find({ user_id: _user_id })
      await user.verifyPassword(password)

      await user.delete()
      await User.deleteAllAccessToken(req)
      await User.deleteAuthData(req)

      return res.status(200).send({ success: true, message: 'Delete complete!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete')
      return res.status(result.status).send(result.send)
    }
  })

Router.put('/user/avatar', auth, async (req: Request, res: Response) => {
  const { _user_id, picture } = req.body

  try {
    const [user] = await User.find({ user_id: _user_id })

    const file = new File(picture)
    if (!file.validateTypes(['data:image/png;base64'])) throw new ArisError('Invalid file Type!', 400)
    file.buffer = await Picture.parseBuffer(file.buffer)
    const current_uuid = user.get('avatar_uuid')
    const avatar_uuid =
      current_uuid === 'default' ? await file.insert('profile', 'image/png') : await file.update('profile', 'image/png', current_uuid)

    await user.update({ avatar_uuid })

    return res.status(200).send({ success: true, message: 'Avatar uploaded!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Upload avatar')
    return res.status(result.status).send(result.send)
  }
})

export default Router
