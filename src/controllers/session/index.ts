import proposalController from './proposal/proposalController'
import categoryController from './proposal/categoryController'
import statusController from './proposal/statusController'
import auth from '../../middlewares/auth'
import { Application } from 'express'

export default (app: Application) => {
  app.use('/session', auth,
    proposalController,
    categoryController,
    statusController
  )
}