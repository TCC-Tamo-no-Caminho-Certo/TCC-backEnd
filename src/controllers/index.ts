import proposalController from './proposal/proposal'
import categoryController from './proposal/category'
import roleReqController from './request/roleReq'
import statusController from './proposal/status'
import userController from './user/user'
import authController from './authController'

import permission from '../middlewares/permission'
import auth from '../middlewares/auth'

import { Application } from 'express'

export default (app: Application) => {
  // ----Session---- //

  // Auth/Permission (routes that needs to be authenticated)
  app
    .use('/api/logout', auth)
    .use('/api/validate-session', auth)
    .use('/api/proposal', auth)
    .use('/api/user', auth)
    .use('/api/request', auth, permission(['moderator']))

  // Proposal
  app
    .use(`/api/proposal`, proposalController)
    .use(`/api/proposal/category`, categoryController)
    .use(`/api/proposal/status`, statusController)

  // User
  app.use(`/api/user`, userController)

  // Request
  app.use('/api/request/role', roleReqController)

  // --------------- //

  // ----Public---- //
  app.use('/', authController)

  // --------------- //
}