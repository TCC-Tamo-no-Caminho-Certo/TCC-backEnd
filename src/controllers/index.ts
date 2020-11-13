import proposalController from './proposal/proposalController'
import categoryController from './proposal/categoryController'
import roleReqController from './moderator/roleReqController'
import statusController from './proposal/statusController'
import userController from './user/userController'
import authController from './authController'

import permission from '../middlewares/permission'
import auth from '../middlewares/auth'

import { Application } from 'express'

export default (app: Application) => {
  // ----Session---- //

  // Auth (routes that needs to be authenticated)
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
    
  app.use('/api/moderator', permission(['moderator']), roleReqController)
  
  // --------------- //

  // ----Public---- //
  app.use('/', authController)

  // --------------- //
}