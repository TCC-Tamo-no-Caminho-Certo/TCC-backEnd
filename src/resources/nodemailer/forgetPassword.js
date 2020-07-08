const transporter = require('.')


module.exports = (params = { email: "" }) => transporter.sendMail({
  from: "<gabriel.nori@hotmail.com>",
  to: params.email,
  subject: 'Hello ✔',
  text: 'Hello world?',
  html: '<b>Hello world?</b>'
})