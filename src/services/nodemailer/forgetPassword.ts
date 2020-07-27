import transport from '.'

export default (params = { to: '' }) =>
  transport.sendMail({
    from: '<gabriel.nori@hotmail.com>',
    to: params.to,
    subject: 'Hello ✔',
    text: 'Hello world?',
    html: '<b>Hello world?</b>'
  })
