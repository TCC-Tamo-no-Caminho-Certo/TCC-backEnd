import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/universities(/:university_id)?/campus(/:id)?', auth, async (req: Request, res: Response) => {
    const { id, university_id } = req.params
    const { ...filter } = req.query

    try {
      filter.university_id = university_id || filter.university_id
      filter.id = id || filter.id

      const campus = UniversityService.campus.find(filter)

      return res.status(200).send({ success: true, message: 'Fetch complete!', campus: id ? campus[0] : campus })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .post('/universities/:university_id/campus', auth, permission(['administrator']), async (req: Request, res: Response) => {
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

Router.route('/universities/:university_id/campus/:id')
  .patch(auth, permission(['administrator']), async (req: Request, res: Response) => {
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

  .delete(auth, permission(['administrator']), async (req: Request, res: Response) => {
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
