import Nodemailer from '../services/nodemailer'
import { emitter } from './'

emitter.on('SingUp', ({ email_address, token }) => Nodemailer.confirmSignUp({ to: email_address, token }))

emitter.on('Email_Add', ({ email_address, token }) => Nodemailer.confirmEmail({ to: email_address, token }))

emitter.on('ForgotPassword', ({ email_address, token }) => Nodemailer.forgotPass({ to: email_address, token }))

emitter.on('Role_Req_Reject', ({ email_address, feedback }) => Nodemailer.roleReqReject({ to: email_address, feedback }))
