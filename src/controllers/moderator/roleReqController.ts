import RoleReq from '../../models/request/roleReqModel'
import ArisError from '../../utils/arisError'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get/:page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)

  try {
    const requests = await RoleReq.getAllRequests(page)

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update/:id', async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)
  const { data, status } = req.body

  try {
    const request = await RoleReq.getRequest(request_id)
    await request.update({ data, status })

    return res.status(200).send({ success: true, message: 'Update complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete/:id', async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    const request = await RoleReq.getRequest(request_id)
    await request.delete()

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
