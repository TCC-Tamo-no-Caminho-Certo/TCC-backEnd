import redis, { RedisClient } from 'redis'
import logger from '../logger'

class RedisManager {
  client: RedisClient | null = null

  initialize(host: string, port: number, database: string | number, password: string | null | undefined) {
    if (password) {
      this.client = redis.createClient({
        host: host,
        port: port,
        db: database,
        password: password
      })
    } else {
      this.client = redis.createClient({
        host: host,
        port: port,
        db: database
      })
    }
    this.client.on('error', function (error: any) {
      logger.error(error)
    })
  }
}

const redisManager = new RedisManager()
export default redisManager
