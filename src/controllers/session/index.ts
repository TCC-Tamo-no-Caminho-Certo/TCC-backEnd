import proposalController from './proposal/proposalController'
import categoryController from './proposal/categoryController'
import statusController from './proposal/statusController'
import userController from './user/userController'
import auth from '../../middlewares/auth'
import { Application } from 'express'

const path = '/api/session'
export default (app: Application) => {
  app.use(path, auth)

  app
    .use(`${path}/proposal`, proposalController)
    .use(`${path}/proposal/category`, categoryController)
    .use(`${path}/proposal/status`, statusController)

  app.use(`${path}/user`, userController)
}
