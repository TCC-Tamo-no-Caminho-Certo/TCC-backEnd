const Proposal = require('../../models/proposal/proposalModel')
const { professor } = require('../../middlewares/permition')
const Data = require('../../models/dataModel')
const auth = require('../../middlewares/auth')
const route = require('express').Router()



route.get('/proposal/:page', async (req, res) => {
  const page = parseInt(req.params.page)
  const filter = req.body

  try {

    const proposals = await Proposal.get.ids(filter, page)

    if (proposals.list === 'Didn´t find any proposal') return res.status(200).send(proposals)

    const list = Data.processing(proposals)

    res.status(200).send({ list })

  } catch (error) {

    console.log(error)
    res.status(400).send({ Error: 'Fetch failled!' })

  }
})

route.post('/proposal', professor, async (req, res) => {

  const { title, version, status, categories } = req.body
  const { userID } = req

  try {
    const proposal = new Proposal({ title, version, status, categories, userID })

    const result = await proposal.insert()

    if (result.Error) return res.status(400).send(result)

    res.status(200).send({
      Success: "Proposal created!",
      proposalID: result,
      title,
      version,
      status,
      categories
    })

  } catch (error) {

    console.log(error)
    return res.status(400).send({ Error: 'Creation failed!' })

  }
})

route.patch('/proposal/:id', professor, async (req, res) => {

  const { title, version, status, categories } = req.body
  const proposalID = parseInt(req.params.id)
  const { userID } = req

  try {
    if (!await Proposal.isOwner(userID, proposalID)) return res.status(400).send({ Error: 'Not the owner of the proposal, or proposal not found!' })

    const result = await Proposal.updateAll({ title, version, status, categories, proposal_id: proposalID })

    if (result.Error) return res.status(400).send(result)


    res.status(200).send({
      Success: 'Proposal updated!',
      proposalID,
      title: title || 'Not updated',
      version: version || 'Not updated',
      status: status || 'Not updated',
      categories: categories || 'Not updated'
    })

  } catch (error) {

    console.log(error)
    res.status(400).send({ Error: 'Update failled!' })

  }

})

route.delete('/proposal/:id', professor, async (req, res) => {

  const proposalID = parseInt(req.params.id)
  const userID = req.userID

  try {
    if (!await Proposal.isOwner(userID, proposalID)) return res.status(400).send({ Error: 'Not the owner of the proposal, or proposal not found!' })

    await Proposal.delete(proposalID)

    res.status(200).send({ Success: 'Proposal deleted!', proposalID })

  } catch (error) {

    console.log(error)
    res.status(400).send({ Error: 'Delete failled!' })

  }

})

module.exports = app => app.use('/session', auth, route)