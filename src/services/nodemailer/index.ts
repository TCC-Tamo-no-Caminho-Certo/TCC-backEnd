import confirmEmail from './templates/confirmEmail'
import forgotPassword from './templates/forgotPassword'
import confirmRegister from './templates/confirmRegister'

export default class Mail {
  static forgotPass = forgotPassword
  static confirmEmail = confirmEmail
  static confirmRegister = confirmRegister
}
