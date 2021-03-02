import ValSchema, { P } from '../../utils/validation'
import University from '../../utils/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.post('/university', auth, permission(['admin']), async (req: Request, res: Response) => {
  const { name, professor_regex, student_regex } = req.body

  try {
    new ValSchema({
      name: P.joi.string().required(),
      professor_regex: P.joi.string().required(),
      student_regex: P.joi.string().required()
    }).validate({ name, professor_regex, student_regex })

    await University.create({ name, professor_regex, student_regex })

    return res.status(200).send({ success: true, message: 'University created!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Create university')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/university/:id')
  .patch(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name, professor_regex, student_regex } = req.body
    const university_id = parseInt(req.params.id)

    try {
      new ValSchema({
        university_id: P.joi.number().positive().required(),
        name: P.joi.string(),
        professor_regex: P.joi.string(),
        student_regex: P.joi.string()
      }).validate({ university_id, name, professor_regex, student_regex })

      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)
      await university.update({ name, professor_regex, student_regex })

      return res.status(200).send({ success: true, message: 'University updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update university')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.id)

    try {
      new ValSchema(P.joi.number().positive().required()).validate(university_id)

      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)
      await university.delete()

      return res.status(200).send({ success: true, message: 'University deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete university')
      return res.status(result.status).send(result.send)
    }
  })

Router.get('/universities', auth, async (req: Request, res: Response) => {
  const page = req.query.page
  const per_page = req.query.per_page

  try {
    new ValSchema({
      page: P.joi.number().positive(),
      per_page: P.joi.number().min(1).max(100)
    }).validate({ page, per_page })
    const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

    const universities = await University.find({}, pagination)
    const result = universities.map(university => university.format())

    return res.status(200).send({ success: true, message: 'Get universities complete!', universities: result })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get Universities')
    return res.status(result.status).send(result.send)
  }
})

export default Router
