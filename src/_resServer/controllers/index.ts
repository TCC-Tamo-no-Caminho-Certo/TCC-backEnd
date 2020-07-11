import { Application } from 'express'
import proposalController from './proposalController'

export default (app: Application) => {
  proposalController(app)
}