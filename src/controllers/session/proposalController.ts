import express, { Request, Response, Application } from 'express'
import Proposal from '../../models/proposal/proposalModel'
import { professor } from '../../middlewares/permition'
import ArisError from '../../models/arisErrorModel'
import Data from '../../models/dataModel'
import auth from '../../middlewares/auth'
const route = express.Router()



route.get('/proposal/:page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const { ids, titles, version, status, categories, users, created_at, updated_at } = req.body
  const filters = { ids, titles, version, status, categories, users, created_at, updated_at }

  try {

    const proposals = await Proposal.get.ids(filters, page)

    if (typeof proposals === 'string') return res.status(200).send({ Success: true, Message: 'Fecth complete!', list: proposals })

    const list = Data.processing(proposals)

    res.status(200).send({ Success: true, Message: 'Fecth complete!', list })

  } catch (error) {

    console.log(error)
    return res.status(500).send({ Success: false, Message: 'Fetch failed!' })

  }
})

route.post('/proposal', professor, async (req: Request, res: Response) => {

  const { user_id, title, version, status, categories } = req.body

  try {

    Data.validate({ title, version, status, categories }, 'proposal_post')

    const proposal = new Proposal({ title, version, status, categories, user_id })

    const id = await proposal.insert()

    res.status(200).send({
      Success: true,
      Message: "Proposal created!",
      id,
      title,
      version,
      status,
      categories
    })

  } catch (error) {

    const result = ArisError.errorHandler(error, 'Creation unauthorized!')

    if (!result) {
      console.log(error)
      return res.status(500).send({ Success: false, Message: 'Creation failed!' })
    }
    return res.status(result.status).send(result.send)

  }
})

route.patch('/proposal/:id', professor, async (req: Request, res: Response) => {

  const { user_id, title, version, status, categories } = req.body
  const proposal_id = parseInt(req.params.id)

  try {

    Data.validate({ title, version, status, categories }, 'proposal_patch')

    if (!await Proposal.isOwner(user_id, proposal_id)) throw new ArisError('Not the owner of the proposal, or proposal not found!', 400)

    await Proposal.update({ title, version, status, categories, proposal_id })

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

    const result = ArisError.errorHandler(error, 'Update unauthorized!')

    if (!result) {
      console.log(error)
      return res.status(500).send({ Success: false, Message: 'Update failed!' })
    }
    return res.status(result.status).send(result.send)

  }

})

route.delete('/proposal/:id', professor, async (req: Request, res: Response) => {

  const proposal_id = parseInt(req.params.id)
  const { user_id } = req.body

  try {

    if (!await Proposal.isOwner(user_id, proposal_id))
      throw new ArisError('Not the owner of the proposal, or proposal not found!', 400)

    await Proposal.delete(proposal_id)

    res.status(200).send({ Success: true, Message: 'Proposal deleted!', proposal_id })

  } catch (error) {

    const result = ArisError.errorHandler(error, 'Delete unauthorized!')

    if (!result) {
      console.log(error)
      return res.status(500).send({ Success: false, Message: 'Delete failled!' })
    }
    return res.status(result.status).send(result.send)

  }
})

export default (app: Application) => app.use('/session', auth, route)