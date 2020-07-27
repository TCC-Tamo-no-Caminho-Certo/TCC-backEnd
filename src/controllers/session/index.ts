import proposalController from './proposal/proposalController'
import categoryController from './proposal/categoryController'
import statusController from './proposal/statusController'
import userController from './user/userController'
import auth from '../../middlewares/auth'
import { Application } from 'express'

export default (app: Application) => {
  app.use('/session', auth)

  app
    .use('/session/proposal', proposalController)
    .use('/session/proposal/category', categoryController)
    .use('/session/proposal/status', statusController)

  app.use('/session/user', userController)
  console.log(app.stack)
}
