import transport, { MailConfig } from '../transport'
import ArisError from '../../../utils/arisError'
import config from '../../../config'

export default async ({ to, token }: MailConfig) =>
  transport.sendMail(
    {
      from: '<gabriel.nori@hotmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `
            <form action="http://${config.environment === 'development' ? 'dev.' : null}steamslab.com/api/confirm-register/${token}" method="post">
              <input type="hidden" name="query" id="query"/>
              <button type="submit">link</button>
            </form>
            `
    },
    err => {
      if (err) throw new ArisError('Couldn´t send email for confirm email!', 500)
    }
  )
