import transport, { MailConfig } from '../transport'
import ArisError from '../../../utils/arisError'
import config from '../../../config'

export default async ({ to, token, link }: MailConfig) =>
  transport.sendMail(
    {
      from: '<gabriel.nori@hotmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `<a href="http://${config.environment === 'development' ? 'dev.' : null}steamslab.com/api/confirm-register/${token}">${link}</a>`
    },
    err => {
      if (err) throw new ArisError('Couldn´t send email for confirm email!', 500)
    }
  )