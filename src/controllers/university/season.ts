import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/:university_id/season')
  .get(auth, async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const { page, per_page } = req.query

    try {
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }

      const seasons = await UniversityService.season.find({ university_id }, pagination)

      return res.status(200).send({ success: true, message: 'Fetch complete!', seasons })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, permission(['moderator']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const { data } = req.body

    try {
      await UniversityService.season.add(university_id, data)

      return res.status(200).send({ success: true, message: 'Season created!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Create season')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/:university_id/season/:id')
  .patch(auth, permission(['moderator']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const id = parseInt(req.params.id)
    const { data } = req.body

    try {
      await UniversityService.season.update({ id, university_id }, data)

      return res.status(200).send({ success: true, message: 'Season updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update season')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.university_id)
    const id = parseInt(req.params.id)

    try {
      await UniversityService.season.delete({ id, university_id })

      return res.status(200).send({ success: true, message: 'Season deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete season')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
