import { ValidationError } from 'joi'

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
    return info
  }
}

function JoiErrorHandler(error: ValidationError, message: string) {
  if (error.isJoi) {
    const error_list: any = {}
    error.details.forEach(error_element => (error_list[`${error_element.path}`] = error_element.message))
    return { status: 400, send: { Success: false, Message: message + ' unauthorized!', Error: error_list } }
  }
}

function ArisErrorHandler(error: ArisError, message: string) {
  if (error.isAris) {
    return { status: error.status, send: { Success: false, Message: message + ' unauthorized!', Error: error.details } }
  }
}

function SystemErrorHandler(error: Error, message: string) {
  console.log(error)
  return { status: 500, send: { Success: false, Message: message + ' failed!' } }
}
