import Nodemailer from '../services/nodemailer'
import { emitter } from './'

emitter.on('SingUp', ({ email_address, token }) => Nodemailer.confirmRegister({ to: email_address, token }))

emitter.on('Email_Add', ({ email_address, token }) => Nodemailer.confirmEmail({ to: email_address, token }))

emitter.on('ForgotPassword', ({ email_address, token }) => Nodemailer.forgotPass({ to: email_address, token }))
