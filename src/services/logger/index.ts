import path from 'path'
import util from 'util'
import fs from 'fs'

var makeArray = function (nonArray: any) {
  return Array.prototype.slice.call(nonArray)
}

var checkZero = function (data: any) {
  if (data.length == 1) {
    data = '0' + data
  }
  return data
}

var formatDate = function (date: Date) {
  var day = date.getDate() + ''
  var month = date.getMonth() + 1 + ''
  var year = date.getFullYear() + ''
  var hour = date.getHours() + ''
  var minutes = date.getMinutes() + ''
  var seconds = date.getSeconds() + ''
  var milliseconds = date.getMilliseconds() + ''

  day = checkZero(day)
  month = checkZero(month)
  year = checkZero(year)
  hour = checkZero(hour)
  minutes = checkZero(minutes)
  seconds = checkZero(seconds)
  milliseconds = checkZero(milliseconds)

  return day + '/' + month + '/' + year + ' ' + hour + ':' + minutes + ':' + seconds + ',' + milliseconds
}

class Logger {
  logLevelIndex: number
  stream?: fs.WriteStream
  static levels: string[] = ['fatal', 'error', 'warn', 'info', 'debug']

  constructor(log_file_path: string) {
    this.logLevelIndex = 3
    // if a path is given, try to write to it
    if (log_file_path) {
      // Write to a file
      log_file_path = path.normalize(log_file_path)
      this.stream = fs.createWriteStream(log_file_path, {
        flags: 'a',
        encoding: 'utf8',
        mode: 666
      })
      this.stream.write('\n')
    }
  }

  write(text: string) {
    this.stream?.write(text)
  }

  format(level: string, date: Date, message: string) {
    return ['[', formatDate(date), '] ', '[', level.charAt(0).toUpperCase(), level.slice(1), ']', message].join('')
  }

  setLevel(newLevel: string) {
    var index = Logger.levels.indexOf(newLevel)
    return index != -1 ? (this.logLevelIndex = index) : false
  }

  log(argsData: any) {
    var args = makeArray(argsData)
    var logIndex = Logger.levels.indexOf(args[0])
    var message = ''
    if (logIndex === -1) logIndex = this.logLevelIndex
    else args.shift()
    if (logIndex <= this.logLevelIndex) {
      args.forEach(function (arg) {
        if (typeof arg === 'string') {
          message += ' ' + arg
        } else {
          message += ' ' + util.inspect(arg, false, null)
        }
      })
      message = this.format(Logger.levels[logIndex], new Date(), message)
      this.write(message + '\n')
      switch (Logger.levels[logIndex]) {
        case 'fatal':
          console.error(message)
          break
        case 'error':
          console.error(message)
          break
        case 'warn':
          console.warn(message)
          break
        case 'info':
          console.info(message)
          break
        case 'debug':
          console.debug(message)
          break
      }
      return message
    }
    return false
  }
}

class LoggerManager {
  loggerInstance: Logger | undefined

  initializeLogger(folderPath: string, fileName: string) {
    var filePath = path.resolve(folderPath)
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
    filePath = path.resolve(path.join(filePath, fileName))
    this.loggerInstance = new Logger(filePath)
    return this.loggerInstance
  }

  fatal(...args: any[]) {
    args.unshift('fatal')
    return this.loggerInstance?.log(args)
  }

  error(...args: any[]) {
    args.unshift('error')
    return this.loggerInstance?.log(args)
  }

  warn(...args: any[]) {
    args.unshift('warn')
    return this.loggerInstance?.log(args)
  }

  info(...args: any[]) {
    args.unshift('info')
    return this.loggerInstance?.log(args)
  }

  debug(...args: any[]) {
    args.unshift('debug')
    return this.loggerInstance?.log(args)
  }
}

const loggerManager: LoggerManager = new LoggerManager()
export default loggerManager
