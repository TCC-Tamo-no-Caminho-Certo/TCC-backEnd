import ArisError from '../../models/arisErrorModel'
import transport from '.'

type email = string

export interface MailConfig {
  to: email
  token: string
  link: string
}

export default async ({ to, token, link }: MailConfig) =>
  transport.sendMail(
    {
      from: '<gabriel.nori@hotmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `<a>${link}</a>
            token: ${token}`
    },
    err => {
      if (err) throw new ArisError('Couldn´t send reset password email!', 500)
    }
  )
