import universityController from './university/university'
import campusController from './university/campus'
import courseController from './university/course'

import proposalController from './proposal/proposal'
import categoryController from './proposal/category'
import statusController from './proposal/status'

import roleReqsController from './user/role/requests'
import roleReqController from './user/role/request'
import roleController from './user/role/role'

import moderatorController from './user/moderator'
import professorController from './user/professor'
import studentController from './user/student'
import emailController from './user/email'
import usersController from './user/users'
import userController from './user/user'

import infoController from './info/info'

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
    .use('/api/user/role', moderatorController, professorController, studentController, roleReqController, roleReqsController)

  // University
  app
    .use('/api', universityController)
    .use('/api/university', campusController)
    .use('/api/university/campus', courseController)

  // Info
  app
    .use('/api/info', infoController)

  // Development
  app
    .use('/api/dev', devController)

  // --------------- //

  // ----Public---- //
  app.use('/', authController)

  // --------------- //
}