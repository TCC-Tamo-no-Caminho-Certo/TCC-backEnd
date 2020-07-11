import path from 'path'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({
    path: 'src/config/.env'
})

import express from 'express'

const app = express()

app.use(express.json())
app.use(cors())
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

import controllers from './controllers'
controllers(app)


export default app