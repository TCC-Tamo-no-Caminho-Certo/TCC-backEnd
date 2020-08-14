import nodemailer from 'nodemailer'
import config from '../../config'

type email = string

export interface MailConfig {
  to: email
  token: string
  link: string
}

const transport = nodemailer.createTransport(config.mail)

export default transport
