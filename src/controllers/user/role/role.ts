import ValSchema, { P } from '../../../utils/validation'
import ArisError from '../../../utils/arisError'
import User from '../../../utils/user'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.route('/role').get()

export default Router
