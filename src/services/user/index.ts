import { EmailModel, IEmailModel } from '../../database/models/user/email'
import { UserModel, IUserModel } from '../../database/models/user/user'
import { RoleModel, IRoleModel } from '../../database/models/user/role'
import EmailSubService from './email'
import RoleSubService from './role'
import Lucene from '../lucene'
import Redis from '../redis'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import { emitter } from '../../subscribers'
import Picture from '../../utils/jimp'
import File from '../../utils/minio'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import argon from 'argon2'

import { Pagination, RoleTypes } from '../../@types/types'

export class UserService {
  private EmailModel: IEmailModel
  private UserModel: IUserModel
  private RoleModel: IRoleModel

  public email: typeof EmailSubService
  public role: typeof RoleSubService

  constructor(User: IUserModel, Email: IEmailModel, Role: IRoleModel, email_sub: typeof EmailSubService, role_sub: typeof RoleSubService) {
    this.EmailModel = Email
    this.UserModel = User
    this.RoleModel = Role

    this.email = email_sub
    this.role = role_sub
  }

  async signUp(user_data: any, email_address: string) {
    new ValSchema({
      user_data: P.joi.object({
        name: P.user.name.required(),
        surname: P.user.surname.required(),
        phone: P.user.phone,
        birthday: P.user.birthday.required(),
        password: P.user.password.required()
      }),
      email_address: P.user.email.required()
    }).validate({ user_data, email_address })

    const [have_user] = await this.EmailModel.find({ address: email_address, main: true })
    if (have_user) throw new ArisError('User already exists', 400)

    const hash = await argon.hash(user_data.password)
    user_data.password = hash

    const token = uuidv4()

    await Redis.client.setexAsync(`register:${token}`, 86400, JSON.stringify({ user_data, email_address }))

    emitter.emit('SingUp', { user_data, email_address, token })
  }

  async signIn(email: string, password: string, remember: boolean = false) {
    new ValSchema({
      email: P.user.email.required(),
      password: P.user.password.required(),
      remember: P.auth.remember.required()
    }).validate({ email, password, remember })

    const [have_email] = await this.EmailModel.find({ address: email, main: true })
    if (!have_email) throw new ArisError('User not found!', 400)
    const { user_id } = have_email

    const [user] = await this.UserModel.find({ id: user_id })
    const { password: hash } = user

    if (!(await argon.verify(hash, password))) throw new ArisError('Incorrect password!', 400)

    const [roles] = await this.RoleModel.find({ user_id }).select('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator')
    const user_roles = Object.keys(roles).filter(key => roles[key] === 1) as RoleTypes[]

    const access_token = await this.generateAccessToken(user_id, user_roles, remember)

    emitter.emit('SingIn', { user_id, roles: user_roles, remember })

    const user_data: any = user
    user_data.roles = user_roles
    delete user_data.password

    return { access_token, user: user_data }
  }

  async signOut(auth: string) {
    const parts = auth.split(' ')
    const [, token] = parts

    await Redis.client.delAsync(`auth:${token}`)
  }

  async update(primary: any, update_data: any, password: string) {
    new ValSchema({
      primary: P.joi.object({
        id: P.joi.number().integer().positive().required()
      }),
      update_data: P.joi.object({
        name: P.user.name.allow(null),
        surname: P.user.surname.allow(null),
        birthday: P.user.birthday.allow(null),
        phone: P.user.phone.allow(null),
        new_password: P.user.password.allow(null)
      }),
      password: P.joi.string().required()
    }).validate({ primary, update_data, password })

    const [user] = await this.UserModel.find(primary)
    if (!(await argon.verify(user.password, password))) throw new ArisError('Incorrect password!', 400)

    if (update_data.new_password) {
      update_data.password = await argon.hash(update_data.new_password)
      delete update_data.new_password
    }

    await this.UserModel.update(primary, update_data)

    emitter.emit('User_Update', { user_data: user, update_data }) // lucene

    Object.keys(update_data).forEach(key => update_data[key] === undefined && delete update_data[key])
    const response = { ...user, ...update_data }
    delete response.password

    response.full_name = `${response.name} ${response.surname}`

    return response
  }

  async updateAvatar(primary: any, picture: string) {
    new ValSchema({
      primary: P.joi.object({
        id: P.joi.number().integer().positive().required()
      }),
      picture: P.joi.string().required()
    }).validate({ primary, picture })

    const [user] = await this.UserModel.find(primary)

    const file = new File(picture)
    if (!file.validateTypes(['data:image/png;base64', 'data:image/jpeg;base64'])) throw new ArisError('Invalid file Type!', 400)
    file.buffer = await Picture.parseBuffer(file.buffer)

    const current_uuid = user.avatar_uuid
    const avatar_uuid = current_uuid === 'default' ? await file.insert('profile') : await file.update('profile', current_uuid)

    await this.UserModel.update(primary, { avatar_uuid })

    return avatar_uuid
  }

  async delete(primary: any, password: any, auth: string) {
    new ValSchema({
      primary: P.joi.object({
        user_id: P.joi.number().integer().positive().required()
      }),
      password: P.user.password.required()
    }).validate({ primary, password })

    const [{ password: hash }] = await this.UserModel.find(primary)
    if (!(await argon.verify(hash, password))) throw new ArisError('Incorrect password!', 400)

    await this.UserModel.delete(primary)

    const parts = auth.split(' ')
    const [, token] = parts

    const keys = await Redis.client.keysAsync(`auth:${primary.user_id}*`)
    await Redis.client.delAsync(keys)
    await Redis.client.delAsync(`auth:data:${primary.user_id}`)

    emitter.emit('User_Delete', { token })
  }

  async find(filter: any, { page, per_page }: Pagination) {
    new ValSchema({
      id: P.filter.ids.allow(null),
      name: P.filter.names.allow(null),
      surname: P.filter.names.allow(null),
      phone: P.filter.string.allow(null),
      birthday: P.filter.string.allow(null),
      full_name: P.filter.string.allow(null),
      created_at: P.filter.date.allow(null),
      updated_at: P.filter.date.allow(null)
    }).validate(filter)

    if (Lucene.enabled && filter.full_name) {
      const d_page = page || 1 - 1,
        d_per_page = per_page || 50

      const data = await Lucene.searchBatch(
        Array.isArray(filter.full_name) ? filter.full_name : [filter.full_name],
        d_page * d_per_page,
        d_page * d_per_page + d_per_page
      )

      filter.id = !filter.id ? [] : Array.isArray(filter.id) ? filter.id : [filter.id]
      if (data.success) data.results?.forEach(result => filter.id.push(parseInt(result.fields.id)))
    }
    delete filter.full_name

    const users = await this.UserModel.find(filter)
      .select('id', 'name', 'surname', 'full_name', 'phone', 'birthday', 'avatar_uuid')
      .paginate(page, per_page)
    return users
  }

  async confirmSignUp(token: string) {
    new ValSchema(P.joi.string().required()).validate(token)

    const reply = await Redis.client.getAsync(`register:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)

    const { user_data, email_address } = JSON.parse(reply)

    user_data.active = true // Change it

    await this.UserModel.createTrx()
    const user = await this.UserModel.insert(user_data)

    const email_data = { user_id: user.id, address: email_address, university_id: null, main: true, options: JSON.stringify({}) }

    await this.EmailModel.insert(email_data)

    await this.RoleModel.insert({ user_id: user.id })
    await this.UserModel.commitTrx()

    emitter.emit('ConfirmSingUp', { user_data: user }) // lucene
  }

  async forgotPassword(email_address: string) {
    new ValSchema(P.joi.string().email().required()).validate(email_address)

    const [{ user_id }] = await this.EmailModel.find({ address: email_address, main: true })

    const token = crypto.randomBytes(3).toString('hex')

    Redis.client.setex(`reset:${token}`, 3600, user_id.toString())

    emitter.emit('ForgotPassword', { email_address, token })
  }

  async resetPassword(token: string, new_password: string) {
    new ValSchema(P.joi.string().required()).validate(token)

    const reply = await Redis.client.getAsync(`reset:${token}`)
    if (!reply) throw new ArisError('Invalid token!', 400)
    const user_id = parseInt(reply)

    if (!new_password) return false

    new ValSchema(P.joi.string().required()).validate(new_password)

    const hash = await argon.hash(new_password)
    await this.UserModel.update({ id: user_id }, { password: hash })

    Redis.client.del(`reset:${token}`)

    return true
  }

  private async generateAccessToken(user_id: number, roles: RoleTypes[], remember?: boolean) {
    const token = uuidv4()

    const reply = await Redis.client.getAsync(`auth:data:${user_id}`)
    const data = JSON.parse(reply)

    if (!data) {
      await Redis.client.setAsync(
        `auth:data:${user_id}`,
        JSON.stringify({
          user_id,
          roles
        })
      )
    }
    await Redis.client.setexAsync(`auth:${user_id}-${token}`, remember ? 2592000 : 86400, user_id.toString())

    return `${user_id}-${token}`
  }
}

export default new UserService(UserModel, EmailModel, RoleModel, EmailSubService, RoleSubService)
