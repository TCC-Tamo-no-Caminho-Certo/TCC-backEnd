import ValSchema, { P } from '../../utils/validation'
import University from '../../utils/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/:id/campus')
  .get(auth, async (req: Request, res: Response) => {
    const page = req.query.page
    const per_page = req.query.per_page
    const university_id = parseInt(req.params.id)

    try {
      new ValSchema({
        page: P.joi.number().positive(),
        per_page: P.joi.number().min(1).max(100),
        university_id: P.joi.number().positive().required()
      }).validate({ page, per_page, university_id })
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

      const campus = await University.Campus.find({ university_id }, pagination)
      const result = campus.map(camp => camp.format())

      return res.status(200).send({ success: true, message: 'Get Campus complete!', campus: result })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get campus')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name } = req.body
    const university_id = parseInt(req.params.id)

    try {
      new ValSchema({
        university_id: P.joi.number().positive().required(),
        name: P.joi.string().required()
      }).validate({ name, university_id })

      await University.Campus.create({ university_id, name })

      return res.status(200).send({ success: true, message: 'Campus created!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Create campus')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/campus/:id')
  .patch(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name } = req.body
    const campus_id = parseInt(req.params.id)

    try {
      new ValSchema({
        campus_id: P.joi.number().positive().required(),
        name: P.joi.string().required()
      }).validate({ name, campus_id })

      const [campus] = await University.Campus.find({ campus_id })
      if (!campus) throw new ArisError('Campus not found!', 400)
      await campus.update({ name })

      return res.status(200).send({ success: true, message: 'Campus updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update campus')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const campus_id = parseInt(req.params.id)

    try {
      new ValSchema(P.joi.number().positive().required()).validate(campus_id)

      const [campus] = await University.Campus.find({ campus_id })
      if (!campus) throw new ArisError('Campus not found!', 400)
      await campus.delete()

      return res.status(200).send({ success: true, message: 'Campus deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete campus')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
