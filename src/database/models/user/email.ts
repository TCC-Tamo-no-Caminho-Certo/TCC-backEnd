import { Model, Increment, Foreign, IModel } from '..'

interface Email {
  id: Increment
  user_id: Foreign
  university_id: Foreign | null
  address: string
  main: boolean
  options: string
}

const EmailModel = new Model<Email>('email', { increment: 'id', foreign: ['user_id'] })

type IEmailModel = IModel<Email>

export { EmailModel, IEmailModel }
