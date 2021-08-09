import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/universities(/:university_id)?/campus(/:campus_id)?/courses(/:id)?', auth, async (req: Request, res: Response) => {
    const { id: course_id, campus_id, university_id } = req.params
    const { ...filter } = req.query

    try {
      filter.university_id = university_id || filter.university_id
      filter.campus_id = campus_id || filter.campus_id
      filter.course_id = course_id || filter.course_id

      const courses = UniversityService.campus.course.find(filter)

      return res.status(200).send({ success: true, message: 'Fetch complete!', [course_id ? 'course' : 'courses']: course_id ? courses[0] : courses })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/universities/:university_id/campus/:campus_id/courses/:id')
  .post(auth, permission(['administrator']), async (req: Request, res: Response) => {
    const { id: course_id, campus_id, university_id } = req.params

    try {
      await UniversityService.campus.course.add({ university_id, campus_id, course_id })

      return res.status(200).send({ success: true, message: 'Course added!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Add course')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['administrator']), async (req: Request, res: Response) => {
    const { id: course_id, campus_id, university_id } = req.params

    try {
      await UniversityService.campus.course.remove({ university_id, campus_id, course_id })

      return res.status(200).send({ success: true, message: 'Course deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete course')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
