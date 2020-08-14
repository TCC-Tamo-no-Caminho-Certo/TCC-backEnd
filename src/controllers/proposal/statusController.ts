import Status from '../../models/proposal/statusModel'
import permission from '../../middlewares/permission'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get', async (req: Request, res: Response) => {
  try {
    const status = await Status.get.allStatus()
    res.status(200).send({ success: true, message: 'Fecth complete!', status })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

route.post('/post', permission(['admin']), async (req: Request, res: Response) => {
  const { name, icon, description } = req.body

  try {
    Data.validate({ name, icon, description }, 'status_post')

    const status = new Status({ name, icon, description })
    await status.insert()

    res.status(200).send({ success: true, message: 'Status created!', status })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Creation')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update/:id', permission(['admin']), async (req: Request, res: Response) => {
  const { name, icon, description } = req.body
  const status_id = parseInt(req.params.id)

  try {
    Data.validate({ name, icon, description }, 'status_patch')

    const status = await Status.getStatus(status_id)
    await status.update({ name, icon, description })

    res.status(200).send({
      success: true,
      message: 'Status updated!',
      status_id,
      name: name || 'Not updated',
      icon: icon || 'Not updated',
      description: description || 'Not updated'
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete/:id', permission(['admin']), async (req: Request, res: Response) => {
  const status_id = parseInt(req.params.id)

  try {
    const status = await Status.getStatus(status_id)
    await status.delete()

    res.status(200).send({
      success: true,
      message: 'Status deleted!',
      status_id
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
