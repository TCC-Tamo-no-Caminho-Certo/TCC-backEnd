import { Application } from 'express'
import authController from './authController'
import session from './session'

export default (app: Application) => {
  authController(app)
  session(app)
}