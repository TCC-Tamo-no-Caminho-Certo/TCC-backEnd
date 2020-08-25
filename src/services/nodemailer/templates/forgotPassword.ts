import transport, { MailConfig } from '../transport'
import ArisError from '../../../utils/arisError'
import config from '../../../config'

export default async ({ to, token, link }: MailConfig) =>
  transport.sendMail(
    {
      from: '<steamslab.brasil@gmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `<a href="http://${config.environment === 'development' ? 'dev.' : null}steamslab.com/reset-password/${token}">${link}</a>
            token: ${token}`
    },
    err => {
      if (err) throw new ArisError('Couldn´t send reset password email!', 500)
    }
  )
