import { Application } from 'express'
import authController from './authController'

export default (app: Application) => {
  authController(app)
}