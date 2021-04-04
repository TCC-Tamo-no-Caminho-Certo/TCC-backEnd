import ValSchema, { P } from '../../utils/validation'
import University from '../../utils/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/:id/course')
  .get(auth, async (req: Request, res: Response) => {
    const page = req.query.page
    const per_page = req.query.per_page
    const campus_id = parseInt(req.params.id)

    try {
      new ValSchema({
        page: P.joi.number().positive(),
        per_page: P.joi.number().min(1).max(100),
        campus_id: P.joi.number().positive().required()
      }).validate({ page, per_page, campus_id })
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

      const courses = await University.Campus.Course.find({ campus_id }, pagination)
      const result = courses.map(course => course.format())

      return res.status(200).send({ success: true, message: 'Get course complete!', courses: result })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get course')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name } = req.body
    const campus_id = parseInt(req.params.id)

    try {
      new ValSchema({
        campus_id: P.joi.number().positive().required(),
        name: P.joi.string().required()
      }).validate({ name, campus_id })
      
      const [campus] = await University.Campus.find({ campus_id })
      if (!campus) throw new ArisError('Campus not found!', 403)

      await University.Campus.Course.add(campus.get('university_id'), campus_id, name)

      return res.status(200).send({ success: true, message: 'Course added!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Add course')
      return res.status(result.status).send(result.send)
    }
  })

Router.delete('/:id/course/:co_id', auth, permission(['admin']), async (req: Request, res: Response) => {
  const { name } = req.body
  const campus_id = parseInt(req.params.id)
  const course_id = parseInt(req.params.co_id)

  try {
    new ValSchema({
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      name: P.joi.string().required()
    }).validate({ name, campus_id, course_id })

    const [course] = await University.Campus.Course.find({ campus_id, course_id })
    if (!course) throw new ArisError('Course not found!', 400)
    await course.delete()

    return res.status(200).send({ success: true, message: 'Course deleted!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete course')
    return res.status(result.status).send(result.send)
  }
})

export default Router
