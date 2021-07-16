import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/:university_id/campus/:campus_id/course', auth, async (req: Request, res: Response) => {
  const university_id = parseInt(req.params.university_id)
  const campus_id = parseInt(req.params.campus_id)

  try {
    const courses = UniversityService.campus.course.getByCampus(university_id, campus_id)

    return res.status(200).send({ success: true, message: 'Get course complete!', courses })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get course')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/:university_id/campus/:campus_id/course/:id')
  .post(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const campus_id = parseInt(req.params.campus_id)
    const course_id = parseInt(req.params.id)

    try {
      await UniversityService.campus.course.add(university_id, campus_id, course_id)

      return res.status(200).send({ success: true, message: 'Course added!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Add course')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const campus_id = parseInt(req.params.campus_id)
    const course_id = parseInt(req.params.id)

    try {
      await UniversityService.campus.course.remove({ university_id, campus_id, course_id })

      return res.status(200).send({ success: true, message: 'Course deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete course')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
