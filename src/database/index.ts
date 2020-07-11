import dbConfig from '../config/database'
import knex from 'knex'

const connection = knex(dbConfig)

export default connection