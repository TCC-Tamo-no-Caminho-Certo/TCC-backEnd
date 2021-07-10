import Nodemailer from '../services/nodemailer'
import { emitter } from './'

emitter.on('SingUp', async ({ email_address, token }) => await Nodemailer.confirmRegister({ to: email_address, token }))

emitter.on('Email_Add', async ({ email_address, token }) => await Nodemailer.confirmEmail({ to: email_address, token }))

emitter.on('ForgotPassword', async ({ email_address, token }) => await Nodemailer.forgotPass({ to: email_address, token }))
