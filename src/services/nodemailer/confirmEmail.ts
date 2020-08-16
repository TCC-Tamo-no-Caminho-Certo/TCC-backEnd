import transport, { MailConfig } from './transport'
import ArisError from '../../utils/arisError'

export default async ({ to, token, link }: MailConfig) =>
  transport.sendMail(
    {
      from: '<gabriel.nori@hotmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `<a href="dev.steamslab.com/confirm-email/${token}">${link}</a>
            token: ${token}`
    },
    err => {
      if (err) throw new ArisError('Couldn´t send email for confirm email!', 500)
    }
  )
