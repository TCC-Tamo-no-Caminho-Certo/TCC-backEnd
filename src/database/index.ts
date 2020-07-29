import config from "../config";
import knex from "knex";

const connection = knex({
    client: config.database.driver,
    connection: {
        host: config.database.host,
        user: config.database.username,
        password: config.database.password,
        database: config.database.database
    },
    pool: {
        max: config.database.pool.max,
        min: config.database.pool.min
    },
    migrations: {
        directory: config.database.migrations.directory
    }
});

export default connection;