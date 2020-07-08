const dbConfig = require('../config/database')

const connection = require('knex')(dbConfig)

module.exports = connection