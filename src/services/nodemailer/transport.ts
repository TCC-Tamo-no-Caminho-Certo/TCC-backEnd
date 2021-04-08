import nodemailer from 'nodemailer'
import config from '../../config'

const transport = nodemailer.createTransport(config.mail)

export default transport
