import UniversityService from '../../services/university'
import ArisError from '../../utils/arisError'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/universities(/:id)?', auth, async (req: Request, res: Response) => {
  const { ...filter } = req.query
  const { id } = req.params

  try {
    filter.id = id

    const universities = UniversityService.find(filter)

    return res.status(200).send({ success: true, message: 'Fetch complete!', universities })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
}) // Implement filter in  university service

Router.post('/universities', auth, permission(['admin']), async (req: Request, res: Response) => {
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
  .patch(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.id)
    const { data } = req.body

    try {
      await UniversityService.update({ university_id }, data)

      return res.status(200).send({ success: true, message: 'University updated!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Update university')
      return res.status(result.status).send(result.send)
    }
  })

  .delete(auth, permission(['admin']), async (req: Request, res: Response) => {
    const university_id = parseInt(req.params.id)

    try {
      await UniversityService.delete({ university_id })

      return res.status(200).send({ success: true, message: 'University deleted!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Delete university')
      return res.status(result.status).send(result.send)
    }
  })

export default Router
