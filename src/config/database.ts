import dotenv from 'dotenv'
dotenv.config({ path: process.env.NODE_ENV === 'dev' ? 'src/config/.env.development' : 'src/config/.env' })

export default {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  },
  pool: {
    max: 10,
    min: 0
  },
  migrations: {
    directory: '../database/migrations'
  }
}
