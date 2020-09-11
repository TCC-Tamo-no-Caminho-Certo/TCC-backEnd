import proposalController from './proposal/proposalController'
import categoryController from './proposal/categoryController'
import statusController from './proposal/statusController'
import userController from './user/userController'
import authController from './authController'
import publicController from './publicController'
import auth from '../middlewares/auth'
import { Application } from 'express'

export default (app: Application) => {
  // ----Session---- //

  // Auth (routes that needs to be authorized)
  app
    .use('/api/logout', auth)
    .use('/api/validate-session', auth)
    .use('/api/proposal', auth)
    .use('/api/user', auth)

  // Proposal
  app
    .use(`/api/proposal`, proposalController)
    .use(`/api/proposal/category`, categoryController)
    .use(`/api/proposal/status`, statusController)

  // User
  app.use(`/api/user`, userController)
  
  // --------------- //

  // ----Out of session---- //
  app.use('/api', authController)

  // ----Public---- //
  app.use('/', publicController)

}