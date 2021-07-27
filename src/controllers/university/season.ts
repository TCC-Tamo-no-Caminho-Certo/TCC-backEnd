import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/universities(/:university_id)?/seasons(/:id)?', auth, async (req: Request, res: Response) => {
    const { id, university_id } = req.params
    const { page, per_page, ...filter } = req.query

    try {
      const pagination = { page: parseInt(<string>page), per_page: parseInt(<string>per_page) }
      filter.university_id = university_id || filter.university_id
      filter.id = id || filter.id

      const seasons = await UniversityService.season.find(filter, pagination)

      return res.status(200).send({ success: true, message: 'Fetch complete!', [id ? 'season' : 'seasons']: id ? seasons[0] : seasons })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .post('/universities/:university_id/seasons', auth, permission(['moderator']), async (req: Request, res: Response) => {
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

Router.route('/universities/:university_id/seasons/:id')
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

  .delete(auth, permission(['moderator'], ['admin']), async (req: Request, res: Response) => {
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
