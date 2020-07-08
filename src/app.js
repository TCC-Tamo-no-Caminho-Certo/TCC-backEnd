const path = require('path')
const cors = require('cors')
require('dotenv').config({
    path: 'src/config/.env'
})

const express = require('express')

const app = express()

app.use(express.json())
app.use(cors())
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

require('./controllers')(app)


module.exports = app