import universityController from './university/university'
import campusController from './university/campus'
import courseController from './university/course'

import proposalController from './proposal/proposal'
import categoryController from './proposal/category'
import statusController from './proposal/status'

import roleReqsController from './user/role/requests'
import roleReqController from './user/role/request'
import roleController from './user/role/role'

import emailController from './user/email'
import usersController from './user/users'
import userController from './user/user'

import devController from './dev/dev'

import authController from './auth'

import { Application } from 'express'

export default (app: Application) => {
  // ----Session---- //

  // Proposal
  app
    .use('/api/proposal', proposalController)
    .use('/api/proposal/category', categoryController)
    .use('/api/proposal/status', statusController)

  // User
  app
    .use('/api', userController, usersController)
    .use('/api/user', emailController, roleController)
    .use('/api/user/role', roleReqController, roleReqsController)

  // University
  app
    .use('/api', universityController)
    .use('/api/university', campusController)
    .use('/api/university/campus', courseController)

  // Development
  app
    .use('/api/dev', devController)

  // --------------- //

  // ----Public---- //
  app.use('/', authController)

  // --------------- //
}