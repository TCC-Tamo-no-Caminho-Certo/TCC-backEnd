import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/universities(/:university_id)?/campus(/:campus_id)?/courses(/:id)?', auth, async (req: Request, res: Response) => {
    const { id, campus_id, university_id } = req.params
    const { ...filter } = req.query

    try {
      filter.university_id = university_id || filter.university_id
      filter.campus_id = campus_id || filter.campus_id
      filter.id = id || filter.id

      const courses = UniversityService.campus.course.find(filter)

      return res.status(200).send({ success: true, message: 'Get course complete!', [id ? 'course' : 'courses']: id ? courses[0] : courses })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get course')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/universities/:university_id/campus/:campus_id/courses/:id')
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
