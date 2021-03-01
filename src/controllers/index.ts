import proposalController from './proposal/proposal'
import categoryController from './proposal/category'
import statusController from './proposal/status'

import roleReqsController from './user/role/requests'
import roleReqController from './user/role/request'
import roleController from './user/role/role'

import emailController from './user/email'
import usersController from './user/users'
import userController from './user/user'

import authController from './auth'

import { Application } from 'express'

export default (app: Application) => {
  // ----Session---- //

  // Proposal
  app
    .use(`/api/proposal`, proposalController)
    .use(`/api/proposal/category`, categoryController)
    .use(`/api/proposal/status`, statusController)

  // User
  app
    .use(`/api`, userController)
    .use(`/api`, usersController)
    .use(`/api/user`, emailController)
    .use('/api/user', roleController)
    .use('/api/user/role', roleReqController)
    .use('/api/user/role', roleReqsController)

  // --------------- //

  // ----Public---- //
  app.use('/', authController)

  // --------------- //
}