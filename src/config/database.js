require('dotenv').config({
    path: 'src/config/.env'
})

module.exports = {
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