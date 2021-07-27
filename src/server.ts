import config, { EndpointConfig } from './config'
import version from './version.generated'
import controllers from './controllers'
import lucene from './services/lucene'
import logger from './services/logger'
import compression from 'compression'
import redis from './services/redis'
import minio from './services/minio'
import jobs from './database/jobs'
import express from 'express'
import https from 'https'
import http from 'http'
import cors from 'cors'
import path from 'path'

// Initialize External Modules

if (config.logging.use) {
  logger.initializeLogger(config.logging.path, config.logging.filename)
  logger.info('Running ArisLabs Backend - ' + version.major + '.' + version.minor + '.' + version.patch + ' Build ' + version.build)
}

if (config.search.use) {
  lucene.initialize(config.search.baseUrl, 'rolereq')
  logger.info(`Using search at ${config.search.baseUrl}`)
}

redis.initialize(config.redis.host, config.redis.port, config.redis.database, config.redis.password)
logger.info(`Using redis at ${config.redis.host}:${config.redis.port}`)

if (config.minio.use) {
  minio.initialize(config.minio.host, config.minio.port, config.minio.useSsl, config.minio.accessKey, config.minio.secretKey)
  logger.info(`Using minio at ${config.minio.host}:${config.minio.port}`)
}

jobs.initialize()

// App Configuration

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
if (config.environment === 'production') app.use(compression())
app.use('/', express.static(path.resolve(config.server.root.replace('%CurrentDirectory%', __dirname))))

// App Routes

controllers(app)

app.get('/api/version', (req, res) => {
  res.json({
    major: version.major,
    minor: version.minor,
    patch: version.patch,
    build: version.build,
    string: version.major + '.' + version.minor + '.' + version.patch + ' Build ' + version.build
  })
})

app.get('*', (req, res) => res.sendFile(path.resolve(config.server.root.replace('%CurrentDirectory%', __dirname), 'index.html')))

// Server Activation

config.server.endpoints.forEach((endpoint: EndpointConfig) => {
  if (endpoint.enabled) {
    try {
      if (endpoint.useSSL) {
        https.createServer(endpoint.options, app).listen(endpoint.port, endpoint.host)
        logger?.info(`Listening on https://${endpoint.host}:${endpoint.port}`)
      } else {
        http.createServer(app).listen(endpoint.port, endpoint.host)
        logger.info(`Listening on http://${endpoint.host}:${endpoint.port}`)
      }
    } catch (ex) {
      logger?.fatal(`Failed to listen on https://${endpoint.host}:${endpoint.port}`)
      if (ex) {
        logger?.fatal(`${ex.name} - ${ex.message}`)
        if (ex.stack) logger?.fatal(ex.stack)
        throw ex
      }
    }
  }
})

export default app
