import confirmEmail from './templates/confirmEmail'
import roleReqReject from './templates/roleReqReject'
import forgotPassword from './templates/forgotPassword'
import confirmSignUp from './templates/confirmSignUp'

export default class Mail {
  static forgotPass = forgotPassword
  static confirmEmail = confirmEmail
  static roleReqReject = roleReqReject
  static confirmSignUp = confirmSignUp
}
