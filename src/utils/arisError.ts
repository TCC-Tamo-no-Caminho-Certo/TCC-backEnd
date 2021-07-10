import { Model } from '../database/models'
import logger from '../services/logger'
import { ValidationError } from 'joi'
import config from '../config'

export default class ArisError extends Error {
  isAris: boolean
  details: string
  status: number

  /**
   *Creates an Aris Error
   *@param details - Error detail to be returned
   *@param status - Response status to be returned
   */
  constructor(details: string, status: number) {
    super()
    this.name = 'ArisError'
    this.isAris = true
    this.details = details
    this.status = status
  }

  /**
   * @param error
   * @param message - Response message to be sended
   */
  static errorHandler(error: ValidationError | ArisError | Error, message: string) {
    const info = JoiErrorHandler(<ValidationError>error, message) || ArisErrorHandler(<ArisError>error, message) || SystemErrorHandler(error, message)
    Model.has_trx && Model.rollbackTrx()
    return info
  }
}

function JoiErrorHandler(error: ValidationError, message: string) {
  if (error.isJoi) {
    const error_list: any = {}
    error.details.forEach(error_element => (error_list[`${error_element.path}`] = error_element.message))
    return { status: 400, send: { success: false, message: message + ' unauthorized!', error: error_list } }
  }
}

function ArisErrorHandler(error: ArisError, message: string) {
  if (error.isAris) {
    if (error.status === 500) console.log(error)
    return { status: error.status, send: { success: false, message: message + ' unauthorized!', error: error.details } }
  }
}

function SystemErrorHandler(error: Error, message: string) {
  logger.error(error)
  return { status: 500, send: { success: false, message: message + ' failed!', log: config.environment === 'development' ? error : undefined } }
}
