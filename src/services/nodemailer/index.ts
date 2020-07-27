import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '62ff56ff591bea',
    pass: 'e712803310c948'
  }
})

export default transport
