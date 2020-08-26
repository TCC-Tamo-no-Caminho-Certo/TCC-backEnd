import nodemailer from 'nodemailer'
import config from '../../config'

type email = string

export interface MailConfig {
  to: email
  token: string
}

const transport = nodemailer.createTransport(config.mail)

export default transport
