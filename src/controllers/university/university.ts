import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express
  .Router()

  .get('/universities(/:id)?', auth, async (req: Request, res: Response) => {
    const { ...filter } = req.query
    const { id } = req.params

    try {
      filter.id = id || filter.id

      const universities = UniversityService.find(filter)

      return res
        .status(200)
        .send({ success: true, message: 'Fetch complete!', [id ? 'university' : 'universities']: id ? universities[0] : universities })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Fetch')
      return res.status(result.status).send(result.send)
    }
  })

  .post('/universities', auth, permission(['developer']), async (req: Request, res: Response) => {
    const { data } = req.body

    try {
      await UniversityService.register(data)

      return res.status(200).send({ success: true, message: 'University created!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Create university')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/universities/:id')
  .patch(auth, permission(['developer']), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { data } = req.body

    try {
      await UniversityService.update({ id }, data)

      return res.status(200).send({ success: true, message: 'University updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update university')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['developer']), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)

    try {
      await UniversityService.delete({ id })

      return res.status(200).send({ success: true, message: 'University deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete university')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
