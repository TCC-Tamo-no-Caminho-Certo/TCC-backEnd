import Proposal from '../../models/proposal/proposalModel'
import { professor } from'../middlewares/permition'
import express, { Request, Response, Application } from 'express'
import Data from '../../models/dataModel'
import auth from '../middlewares/auth'
const route = express.Router()



route.get('/proposal/:page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const filters = req.body
  console.log(req.ips)

  try {

    Data.validate(filters, 'proposal_get')

    const proposals = await Proposal.get.ids(filters, page)

    if (typeof proposals === 'string') return res.status(200).send({ Success: true, Message: 'Fecth complete!', list: proposals })

    const list = Data.processing(proposals)

    res.status(200).send({ Success: true, Message: 'Fecth complete!', list })

  } catch (error) {

    if (error.isJoi) {

      const error_list: any = {}
      error.details.forEach((error_element: any) => {
        error_list.path = error_element.message
      })
      res.status(400).send({ Success: false, Message: 'Fetch unauthorized!', Error: error_list })

    } else {

      console.log(error)
      res.status(500).send({ Success: false, Message: 'Fetch failed!' })

    }
    
  }
})

route.post('/proposal', professor, async (req: Request, res: Response) => {

  const { user_id, title, version, status, categories } = req.body

  try {

    Data.validate({ title, version, status, categories }, 'proposal_post')

    const proposal = new Proposal({ title, version, status, categories, user_id })

    const result = await proposal.insert()

    if (result.Error) return res.status(400).send({ Success: false, Message: 'Creation unauthorized!', Error: result })

    res.status(200).send({
      Success: true,
      Message: "Proposal created!",
      proposalID: result,
      title,
      version,
      status,
      categories
    })

  } catch (error) {

    if (error.isJoi) {

      const error_list: any = {}
      error.details.forEach((error_element: any) => {
        error_list.path = error_element.message
      })
      res.status(400).send({ Success: false, Message: 'Creation unauthorized!', Error: error_list })

    } else {

      console.log(error)
      res.status(500).send({ Success: false, Message: 'Creation failed!' })

    }

  }
})

route.patch('/proposal/:id', professor, async (req: Request, res: Response) => {

  const { user_id, title, version, status, categories } = req.body
  const proposal_id = parseInt(req.params.id)

  try {

    Data.validate({ title, version, status, categories }, 'proposal_patch')

    if (!await Proposal.isOwner(user_id, proposal_id)) return res.status(400).send({ Success: false, Message: 'Not the owner of the proposal, or proposal not found!' })

    const result = await Proposal.updateAll({ title, version, status, categories, proposal_id })

    if (result.Error) return res.status(400).send({ Success: false, Message: 'Update unauthorized!', Error: result })


    res.status(200).send({
      Success: true,
      Message: 'Proposal updated!',
      proposal_id,
      title: title || 'Not updated',
      version: version || 'Not updated',
      status: status || 'Not updated',
      categories: categories || 'Not updated'
    })

  } catch (error) {

    if (error.isJoi) {

      const error_list: any = {}
      error.details.forEach((error_element: any) => {
        error_list.path = error_element.message
      })
      res.status(400).send({ Success: false, Message: 'Update unauthorized!', Error: error_list })

    } else {

      console.log(error)
      res.status(500).send({ Success: false, Message: 'Update failed!' })

    }

  }

})

route.delete('/proposal/:id', professor, async (req: Request, res: Response) => {

  const proposal_id = parseInt(req.params.id)
  const { user_id } = req.body

  try {

    if (!await Proposal.isOwner(user_id, proposal_id))
      return res.status(400).send({ Success: false, Message: 'Delete unauthorized!', Error: 'Not the owner of the proposal, or proposal not found!' })

    await Proposal.delete(proposal_id)

    res.status(200).send({ Success: true, Message: 'Proposal deleted!', proposal_id })

  } catch (error) {

    console.log(error)
    res.status(500).send({ Error: 'Delete failled!' })

  }

})

export default (app: Application) => app.use('/session', auth, route)