import path from 'path'
import fs from 'fs'

// Server
export interface OptionsConfig {
  key?: string
  certificate?: string
}
export interface EndpointConfig {
  enabled: boolean
  host: string
  port: number
  useSSL: boolean
  options: OptionsConfig
}
export interface ServerConfig {
  root: string
  endpoints: EndpointConfig[]
}

// DataBase
export interface ConnectionConfig {
  host: string
  user: string
  password?: string
  database: string
}
export interface PoolConfig {
  max: number
  min: number
}
export interface DatabaseConfig {
  client: string
  connection: ConnectionConfig
  pool: PoolConfig
}

// Redis
export interface RedisConfig {
  host: string
  port: number
  database: number
  password?: string
}

// Minio
export interface MinioConfig {
  host: string
  port: number
  useSsl: boolean
  accessKey: string
  secretKey: string
}

// JWT
export interface JWTConfig {
  privateKey: string
  publicKey: string
  resetSecret: string
}

// Captcha
export interface CaptchaConfig {
  use: boolean
  key: string
}

// Mail
export interface AuthConfig {
  user: string
  pass: string | null
}
export interface MailConfig {
  host: string
  port: number
  auth: AuthConfig
}

// Log
export interface LoggingConfig {
  use: boolean
  path: string
  filename: string
}

class ConfigManager {
  environment: 'development' | 'production' = 'development'

  server: ServerConfig = {
    root: '%CurrentDirectory%/../www',
    endpoints: [
      {
        enabled: true,
        host: '127.0.0.1',
        port: 8080,
        useSSL: false,
        options: {}
      }
    ]
  }

  database: DatabaseConfig = {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'steamslab'
    },
    pool: {
      max: 10,
      min: 0
    }
  }

  redis: RedisConfig = {
    host: '127.0.0.1',
    port: 6379,
    database: 1,
    password: undefined
  }

  minio: MinioConfig = {
    host: '127.0.0.1',
    port: 9000,
    useSsl: false,
    accessKey: '',
    secretKey: ''
  }

  jwt: JWTConfig = {
    privateKey: '',
    publicKey: '',
    resetSecret: ''
  }

  captcha: CaptchaConfig = {
    use: true,
    key: ''
  }

  mail: MailConfig = {
    host: 'smtp.steamslab.com',
    port: 465,
    auth: {
      user: 'username',
      pass: null
    }
  }

  logging: LoggingConfig = {
    use: false,
    path: './logs/',
    filename: './latest.log'
  }

  loadConfig(filename: string): void {
    let folder = path.dirname(filename)
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder)
    }
    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, JSON.stringify(this), 'utf8')
    }

    let text = fs.readFileSync(filename, 'utf8')
    let config: ConfigManager = JSON.parse(text)
    this.server = config.server
    this.database = config.database
    this.redis = config.redis
    this.minio = config.minio
    this.jwt = config.jwt
    this.captcha = config.captcha
    this.mail = config.mail
    this.logging = config.logging
    this.environment = config.environment
  }
}

let configPath = path.join(path.dirname(__filename), '../../.config/server.json')

let processArgs = process.argv.slice(2)
processArgs.forEach(arg => {
  if (arg.startsWith('--config-')) {
    arg = arg.replace('--config-', '')
    configPath = path.resolve(arg)
  }
})

console.log("Loading configuration: " + configPath)

const configManager: ConfigManager = new ConfigManager()
configManager.loadConfig(configPath)

export default configManager
