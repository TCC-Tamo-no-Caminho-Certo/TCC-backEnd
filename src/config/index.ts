import fs from "fs";

export interface OptionsConfig {
  key?: string;
  certificate?: string;
}

export interface EndpointConfig {
  enabled: boolean;
  host: string;
  port: number;
  useSSL: boolean;
  options: OptionsConfig;
}

export interface ServerConfig {
  root: string;
  endpoints: EndpointConfig[];
}

export interface PoolConfig {
  max: number;
  min: number;
}

export interface MigrationsConfig {
  directory: string;
}

export interface DatabaseConfig {
  driver: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | undefined;
  pool: PoolConfig;
  migrations: MigrationsConfig;
}

export interface RedisConfig {
  use: boolean;
  host: string;
  port: number;
  database: number;
  password?: string | null;
}

export interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string | null;
}

export interface LoggingConfig {
  path: string;
  filename: string;
}

export interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  mail: MailConfig;
  logging: LoggingConfig;
}

class ConfigManager implements Config {
  server: ServerConfig = {
    root: "%CurrentDirectory%/../www",
    endpoints: [
      {
        enabled: true,
        host: "127.0.0.1",
        port: 8080,
        useSSL: false,
        options: {},
      },
    ],
  };

  database: DatabaseConfig = {
    driver: "mysql2",
    host: "127.0.0.1",
    port: 3306,
    database: "steamslab",
    username: "root",
    password: "root",
    pool: {
      max: 10,
      min: 0,
    },
    migrations: {
      directory: "../database/migrations",
    },
  };

  redis:RedisConfig = {
    use: false,
    host: "127.0.0.1",
    port: 6379,
    database: 1,
    password: null,
  };

  mail: MailConfig = {
    host: "smtp.steamslab.com",
    port: 465,
    username: "username",
    password: null,
  };

  logging: LoggingConfig = {
    path: "./logs/",
    filename: "./latest.log",
  };

  defaultConfig: Config = {
    server: {
      root: "%CurrentDirectory%/../www",
      endpoints: [
        {
          enabled: true,
          host: "127.0.0.1",
          port: 8080,
          useSSL: false,
          options: {},
        },
      ],
    },
    database: {
      driver: "mysql2",
      host: "127.0.0.1",
      port: 3306,
      database: "steamslab",
      username: "root",
      password: "root",
      pool: {
        max: 10,
        min: 0,
      },
      migrations: {
        directory: "../database/migrations",
      },
    },
    redis: {
      use: false,
      host: "127.0.0.1",
      port: 6379,
      database: 1,
      password: null,
    },
    mail: {
      host: "smtp.steamslab.com",
      port: 465,
      username: "username",
      password: null,
    },
    logging: {
      path: "./logs/",
      filename: "./latest.log",
    },
  };

  loadConfig(filename: string): void {
    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, JSON.stringify(this.defaultConfig), "utf8");
    }
    let text = fs.readFileSync(filename, "utf8");
    let config: Config = JSON.parse(text);
    this.server = config.server;
    this.database = config.database;
    this.redis = config.redis;
    this.mail = config.mail;
    this.logging = config.logging;
  }
}

const configManager: ConfigManager = new ConfigManager();

export default configManager;
