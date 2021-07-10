import ArisError from '../../utils/arisError'
import UniversityService from '../../services/university'

import { auth, permission } from '../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/universities', auth, async (req: Request, res: Response) => {
  try {
    const universities = await UniversityService.find()

    return res.status(200).send({ success: true, message: 'Get universities complete!', universities })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Get Universities')
    return res.status(result.status).send(result.send)
  }
})

Router.route('/university')
  .get(auth, async (req: Request, res: Response) => { // Implement
    const { filter } = req.query

    try {
      const universities = await UniversityService.find()

      return res.status(200).send({ success: true, message: 'Get university complete!', universities })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Get University')
      return res.status(result.status).send(result.send)
    }
  })

  .post(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name, regex } = req.body

    try {
      await UniversityService.register({ name, regex })

      return res.status(200).send({ success: true, message: 'University created!' })
    } catch (error) {
      const result = ArisError.errorHandler(error, 'Create university')
      return res.status(result.status).send(result.send)
    }
  })

Router.route('/university/:id')
  .patch(auth, permission(['admin']), async (req: Request, res: Response) => {
    const { name, regex } = req.body
    const university_id = parseInt(req.params.id)

    try {
      await UniversityService.update({ university_id }, { name, regex })

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
