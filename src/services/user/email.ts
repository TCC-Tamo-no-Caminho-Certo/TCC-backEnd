import { UniversityModel, IUniversityModel } from '../../database/models/university/university'
import { EmailModel, IEmailModel } from '../../database/models/user/email'
import Redis from '../redis'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import { emitter } from '../../subscribers'
import crypto from 'crypto'

import { Pagination } from '../../@types/types'

export class EmailSubService {
  private UniversityModel: IUniversityModel
  private EmailModel: IEmailModel

  constructor(Email: IEmailModel, University: IUniversityModel) {
    this.UniversityModel = University
    this.EmailModel = Email
  }

  async add(user_id: number, email_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().allow(null),
      address: P.joi.string().email().required(),
      main: P.joi.bool().allow(null),
      options: P.joi.object().allow(null)
    }).validate(email_data)

    const { address, university_id } = email_data

    const [has_email] = await this.EmailModel.find({ address })
    if (has_email) throw new ArisError('Email already in use!', 400)

    if (university_id) {
      const [university] = await this.UniversityModel.find({ id: university_id })
      if (!university) throw new ArisError('University not found!', 400)

      const regex = [new RegExp(university.regex.email.professor), new RegExp(university.regex.email.student)]
      if (!regex.some(reg => reg.test(address))) throw new ArisError('Invalid email format!', 400)
    }

    const token = crypto.randomBytes(3).toString('hex')

    await Redis.client.setexAsync(`email:${token}`, 86400, JSON.stringify({ user_id, university_id, address, options: {} }))

    emitter.emit('Email_Add', { email_address: address, token })
  }

  async update(primary: any, update_data: any) {
    new ValSchema({
      primary: P.joi.object({
        id: P.joi.number().integer().positive().required(),
        user_id: P.joi.number().integer().positive().required()
      }),
      update_data: P.joi.object({
        university_id: P.joi.number().positive().allow(null),
        main: P.joi.bool(),
        options: P.joi.object()
      })
    }).validate({ primary, update_data })

    if (update_data.main === true) {
      const [main_email] = await this.EmailModel.find({ user_id: update_data.user_id, main: true })

      await this.EmailModel.createTrx()

      await this.EmailModel.update({ id: main_email.id, user_id: main_email.user_id }, { main: false })

      await this.EmailModel.update(primary, update_data)

      await this.EmailModel.commitTrx()
    } else {
      await this.EmailModel.update(primary, update_data)
    }
  }

  async remove(primary: any) {
    new ValSchema({
      id: P.joi.number().integer().positive().required(),
      user_id: P.joi.number().integer().positive().required()
    }).validate(primary)

    const [email] = await this.EmailModel.find(primary)
    if (email.main) throw new ArisError('Can not delete main email', 400)

    await this.EmailModel.delete(primary)
  }

  async find(filter: any, { page, per_page }: Pagination) {
    const emails = await this.EmailModel.find(filter).paginate(page, per_page)
    return emails
  }

  async confirm(token: string) {
    new ValSchema(P.joi.string().required()).validate(token)

    const reply = await Redis.client.getAsync(`email:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)

    const email_data = JSON.parse(reply)

    let email
    if (email_data.main) {
      const [main_email] = await this.EmailModel.find({ user_id: email_data.user_id, main: true })

      await this.EmailModel.createTrx()
      await this.EmailModel.update({ id: main_email.id, user_id: main_email.user_id }, { main: false })

      email_data.options = JSON.stringify(email_data.options)
      email = await this.EmailModel.insert(email_data)

      await this.EmailModel.commitTrx()
    } else {
      email_data.options = JSON.stringify(email_data.options)
      email = await this.EmailModel.insert(email_data)
    }

    await Redis.client.delAsync(`email:${token}`)

    return email
  }
}

export default new EmailSubService(EmailModel, UniversityModel)
