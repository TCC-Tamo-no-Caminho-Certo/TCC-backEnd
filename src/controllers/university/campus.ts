import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/:university_id/campus')
  .get(auth, async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)

    try {
      const campus = UniversityService.campus.getByUniversity(university_id)

      return res.status(200).send({ success: true, message: 'Get Campus complete!', campus })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get campus')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const { name } = req.body

    try {
      await UniversityService.campus.add(university_id, { name })

      return res.status(200).send({ success: true, message: 'Campus created!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Create campus')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/:university_id/campus/:id')
  .patch(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const campus_id = parseInt(req.params.id)
    const { name } = req.body

    try {
      await UniversityService.campus.update({ university_id, campus_id }, { name })

      return res.status(200).send({ success: true, message: 'Campus updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update campus')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const campus_id = parseInt(req.params.id)

    try {
      await UniversityService.campus.remove({ university_id, campus_id })

      return res.status(200).send({ success: true, message: 'Campus deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete campus')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
