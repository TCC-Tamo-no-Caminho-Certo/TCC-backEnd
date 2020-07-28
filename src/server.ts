import { EndpointConfig } from "./config";

/**
 *  App Configuration
 */

import path from "path";
const configLocation = "../.config/server.json";
const configPath = path.join(path.dirname(__filename), configLocation);

/**
 * Required External Modules
 */
import express from "express";
import http from "http";
import https from "https";
import version from "./version.generated";
import logger from "./services/logger";
import redis from "./services/redis";
import config from "./config";
import cors from "cors";

/**
 * Initialize External Modules
 */

config.loadConfig(configPath);

logger.initializeLogger(config.logging.path, config.logging.filename);
logger.info(
  "Running ArisLabs Backend - " +
    version.major +
    "." +
    version.minor +
    "." +
    version.patch +
    " Build " +
    version.build
);

if (config.redis.use) {
  logger.info(`Using redis at ${config.redis.host}:${config.redis.port}`);
  redis.initialize(
    config.redis.host,
    config.redis.port,
    config.redis.database,
    config.redis.password
  );
}

/**
 * App Variables
 */

const app = express();

/**
 * Setup Definitions
 */

app.use(cors());
app.use(express.json());
app.use(
  "/",
  express.static(
    path.resolve(config.server.root.replace("%CurrentDirectory%", __dirname))
  )
);

/**
 * Server Activation
 */

config.server.endpoints.forEach((endpoint: EndpointConfig) => {
  if (endpoint.enabled) {
    if (endpoint.useSSL) {
      https
        .createServer(endpoint.options, app)
        .listen(endpoint.port, endpoint.host);
      logger?.info(`Listening on https://${endpoint.host}:${endpoint.port}`);
    } else {
      http.createServer(app).listen(endpoint.port, endpoint.host);
      logger?.info(`Listening on http://${endpoint.host}:${endpoint.port}`);
    }
  }
});
