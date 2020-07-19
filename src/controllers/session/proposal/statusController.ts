import Status from '../../../models/proposal/statusModel'
import ArisError from '../../../models/arisErrorModel'
import { admin } from '../../../middlewares/permition'
import express, { Request, Response } from 'express'
import Data from '../../../models/dataModel'
const route = express.Router()


route.get('/status', async (req: Request, res: Response) => {
  try {

    const status = await Status.get.allStatus()
    res.status(200).send({ Success: true, Message: 'Fecth complete!', status })

  } catch (error) {

    console.log(error)
    return res.status(500).send({ Success: false, Message: 'Fetch failed!' })

  }
})

route.post('/status', admin, async (req: Request, res: Response) => {

  const { name, icon, description } = req.body

  try {

    Data.validate({ name, icon, description }, 'status_post')

    const status = new Status({ name, icon, description })
    await status.insert()

    res.status(200).send({ Success: true, Message: 'Status created!', status })

  } catch (error) {

    const result = ArisError.errorHandler(error, 'Creation unauthorized!')

    if (!result) {
      console.log(error)
      return res.status(500).send({ Success: false, Message: 'Creation failled!' })
    }
    return res.status(result.status).send(result.send)

  }
})

route.patch('/status/:id', admin, async (req: Request, res: Response) => {

  const { name, icon, description } = req.body
  const status_id = parseInt(req.params.id)

  try {

    Data.validate({ name, icon, description }, 'status_patch')

    const status = await Status.getStatus(status_id)
    await status.update({ name, icon, description })

    res.status(200).send({
      Success: true,
      Message: 'Status updated!',
      status_id,
      name: name || 'Not updated',
      icon: icon || 'Not updated',
      description: description || 'Not updated'
    })

  } catch (error) {

    const result = ArisError.errorHandler(error, 'Update unauthorized!')

    if (!result) {
      console.log(error)
      return res.status(500).send({ Success: false, Message: 'Update failled!' })
    }
    return res.status(result.status).send(result.send)

  }
})

route.delete('/status/:id', admin, async (req: Request, res: Response) => {

  const status_id = parseInt(req.params.id)

  try {

    const status = await Status.getStatus(status_id)
    await status.delete()

    res.status(200).send({
      Success: true,
      Message: 'Status deleted!',
      status_id
    })

  } catch (error) {

    console.log(error)
    return res.status(500).send({ Success: false, Message: 'Delete failled!' })

  }
})


export default route