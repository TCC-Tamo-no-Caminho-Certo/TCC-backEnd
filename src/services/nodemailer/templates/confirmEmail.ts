import transport, { MailConfig } from '../transport'
import ArisError from '../../../utils/arisError'
import config from '../../../config'

export default async ({ to, token }: MailConfig) =>
  transport.sendMail(
    {
      from: '<steamslab.brasil@gmail.com>',
      to: to,
      subject: 'Hello ✔',
      text: '',
      html: `
            <form action="http://${config.environment === 'development' ? 'dev.' : null}steamslab.com/api/confirm-register" method="post">
              <input type="hidden" name="token"/>
              <button type="submit">link</button>
            </form>
            `
    },
    err => {
      console.error(err);
      //if (err) throw new ArisError('Couldn´t send email for confirm email!', 500)
    }
  )
