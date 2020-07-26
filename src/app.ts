import compression from 'compression'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import path from 'path'

dotenv.config({ path: 'src/config/.env.development' })

import express from 'express'

const app = express()

app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

import controllers from './controllers'
controllers(app)


export default app