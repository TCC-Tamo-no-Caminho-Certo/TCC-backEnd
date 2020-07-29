import path from "path";
const configLocation = ".config/server.json";
const configPath = path.join(path.dirname(__filename), configLocation);

import config from "./src/config";
config.loadConfig(configPath);

module.exports = {
  client: config.database.driver,
  connection: {
      host: config.database.host,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database
  },
  migrations: {
    directory: path.resolve(__dirname, "src", "database", "migrations"),
  },
  seeds: {
    directory: path.resolve(__dirname, "src", "database", "seeds"),
  },
  useNullAsDefault: true,
};
