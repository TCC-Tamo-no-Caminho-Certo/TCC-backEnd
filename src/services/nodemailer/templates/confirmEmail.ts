import transport, { MailConfig } from '../transport'
import ArisError from '../../../utils/arisError'
import config from '../../../config'

export default async ({ to, token }: MailConfig) =>
  transport.sendMail(
    {
      from: '<steamslab.brasil@gmail.com>',
      to: to,
      subject: 'Confirmação de Email - SteamsLab',
      text: '',
      html: `
      <!DOCTYPE html><html>
        <body class="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;" >
          <a href="http://${config.environment === 'development' ? 'dev.' : ''}steamslab.com/confirm/email/${token}" target="_blank" style=" font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; display: inline-block; ">Confirmar Email</a>
          <p>Token: ${token}</p>
        </body>
      </html>`
    },
    err => {
      if (err) throw new ArisError('Couldn`t send email in confirm email template!', 500)
    }
  )
