import Proposal from '../../database/models/proposal/proposal'
import permission from '../../middlewares/permission'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'

import express, { Request, Response } from 'express'
const route = express.Router()

route.post('/get/:page', async (req: Request, res: Response) => {
  const page = parseInt(req.params.page)
  const { ids, titles, version, status, categories, users, created_at, updated_at } = req.body
  const filters = {
    ids,
    titles,
    version,
    status,
    categories,
    users,
    created_at,
    updated_at
  }

  try {
    Data.validate(filters, 'proposal_get')

    const proposals = await Proposal.get.allProposals(filters, page)

    if (typeof proposals === 'string') return res.status(200).send({ success: true, message: 'Fecth complete!', list: proposals })

    const list = Data.processing(proposals)

    res.status(200).send({ success: true, message: 'Fecth complete!', list })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

route.post('/post', permission(['professor']), async (req: Request, res: Response) => {
  const { _user_id, title, version, status, categories } = req.body

  try {
    Data.validate({ title, version, status, categories }, 'proposal_post')

    const proposal = new Proposal({
      title,
      version,
      status,
      categories,
      user_id: _user_id
    })
    await proposal.insert()

    res.status(200).send({
      success: true,
      message: 'Proposal created!',
      id: proposal.proposal_id,
      title,
      version,
      status,
      categories
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Creation')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update/:id', permission(['professor']), async (req: Request, res: Response) => {
  const { _user_id, title, version, status, categories } = req.body
  const proposal_id = parseInt(req.params.id)

  try {
    Data.validate({ title, version, status, categories }, 'proposal_patch')

    const proposal = await Proposal.getProposal(_user_id, proposal_id)
    await proposal.update({ title, version, status, categories })

    res.status(200).send({
      success: true,
      message: 'Proposal updated!',
      proposal_id,
      title: title || 'Not updated',
      version: version || 'Not updated',
      status: status || 'Not updated',
      categories: categories || 'Not updated'
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete/:id', permission(['professor']), async (req: Request, res: Response) => {
  const proposal_id = parseInt(req.params.id)
  const { _user_id } = req.body

  try {
    const proposal = await Proposal.getProposal(_user_id, proposal_id)
    await proposal.delete()

    res.status(200).send({ success: true, message: 'Proposal deleted!', proposal_id })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
