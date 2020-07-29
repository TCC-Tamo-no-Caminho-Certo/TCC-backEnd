import config from "../config";
import knex from "knex";

const connection = knex(config.database);

export default connection;