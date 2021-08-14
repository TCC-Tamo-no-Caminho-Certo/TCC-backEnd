import { Moderator_UniversityModel, IModerator_UniversityModel } from '../../database/models/user_university/moderator'
import { Professor_UniversityModel, IProfessor_UniversityModel } from '../../database/models/user_university/professor'
import { Student_UniversityModel, IStudent_UniversityModel } from '../../database/models/user_university/student'
import { UniversityModel, IUniversityModel } from '../../database/models/university/university'
import { RoleRequestModel, IRoleRequestModel } from '../../database/models/user/role_request'
import { ProfessorModel, IProfessorModel } from '../../database/models/user/professor'
import { StudentModel, IStudentModel } from '../../database/models/user/student'
import { EmailModel, IEmailModel } from '../../database/models/user/email'
import { RoleModel, IRoleModel } from '../../database/models/user/role'
import Redis from '../redis'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import { emitter } from '../../subscribers'
import File from '../../utils/minio'

import { Pagination, RoleTypes } from '../../@types/types'

export class Role_RequestSubService {
  private Moderator_UniversityModel: IModerator_UniversityModel
  private Professor_UniversityModel: IProfessor_UniversityModel
  private Student_UniversityModel: IStudent_UniversityModel
  private RoleRequestModel: IRoleRequestModel
  private UniversityModel: IUniversityModel
  private ProfessorModel: IProfessorModel
  private StudentModel: IStudentModel
  private EmailModel: IEmailModel
  private RoleModel: IRoleModel

  constructor(
    Role: IRoleModel,
    Email: IEmailModel,
    Student: IStudentModel,
    Professor: IProfessorModel,
    University: IUniversityModel,
    Role_Request: IRoleRequestModel,
    Student_University: IStudent_UniversityModel,
    Professor_University: IProfessor_UniversityModel,
    Moderator_University: IModerator_UniversityModel
  ) {
    this.Moderator_UniversityModel = Moderator_University
    this.Professor_UniversityModel = Professor_University
    this.Student_UniversityModel = Student_University
    this.RoleRequestModel = Role_Request
    this.UniversityModel = University
    this.ProfessorModel = Professor
    this.StudentModel = Student
    this.EmailModel = Email
    this.RoleModel = Role
  }

  // Create
  async createStudent(user_id: number, user_roles: RoleTypes[], data: any) {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      semester: P.joi.number().min(1).max(10).required()
    }).validate(data)

    const { university_id, voucher } = data
    delete data.voucher

    if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      data.voucher_uuid = await file.insert('documents')

      await this.RoleRequestModel.insert({ user_id, role: 'student', data: JSON.stringify(data), status: 'awaiting', feedback: null })
    } else {
      const [{ regex: uni_regex }] = await this.UniversityModel.find({ id: university_id })
      const regex = new RegExp(uni_regex.email.student)

      const emails = await this.EmailModel.find({ user_id })

      await this.EmailModel.createTrx()

      let has_inst_email = false
      for (const email of emails) {
        const test = regex.test(email.address)
        if (test) {
          if (!email.university_id) await this.EmailModel.update(email, { university_id })
          data.register = parseInt(email.address.split('@')[0])
        }
        has_inst_email ||= test
      }
      if (!has_inst_email) throw new ArisError('User doesn`t have an institutional email for this role or from this university!', 400)

      if (!user_roles.some((role: string) => role === 'student')) {
        const index = user_roles.findIndex((role: string) => role === 'guest')
        index ? (user_roles[index] = 'student') : user_roles.push('student')

        await this.RoleModel.update({ user_id }, { guest: false, student: true })
        await this.StudentModel.insert({ user_id, lattes: null, linkedin: null })
        await this.Student_UniversityModel.insert({ user_id, ...data })
        await this.updateAccessTokenData(user_id, user_roles)
      } else await this.Student_UniversityModel.insert({ user_id, ...data })

      await this.EmailModel.commitTrx()
    }
  }

  async createProfessor(user_id: number, user_roles: RoleTypes[], data: any) {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      full_time: P.joi.bool().required()
    }).validate(data)

    const { university_id, voucher } = data
    delete data.voucher

    if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      data.voucher_uuid = await file.insert('documents')

      await this.RoleRequestModel.insert({ user_id, role: 'professor', data: JSON.stringify(data), status: 'awaiting', feedback: null })
    } else {
      const [{ regex: uni_regex }] = await this.UniversityModel.find({ id: university_id })
      const regex = new RegExp(uni_regex.email.professor)

      const emails = await this.EmailModel.find({ user_id })

      await this.EmailModel.createTrx()

      let has_inst_email = false
      for (const email of emails) {
        const test = regex.test(email.address)
        if (test && !email.university_id) await this.EmailModel.update(email, { university_id })
        has_inst_email ||= test
      }
      if (!has_inst_email) throw new ArisError('User doesn`t have an institutional email for this role or from this university!', 400)

      if (!user_roles.some((role: string) => role === 'professor')) {
        const index = user_roles.findIndex((role: string) => role === 'guest')
        index ? (user_roles[index] = 'professor') : user_roles.push('professor')

        await this.RoleModel.update({ user_id }, { guest: false, professor: true })
        await this.ProfessorModel.insert({ user_id, postgraduate: null, lattes: null, linkedin: null, orcid: null })
        await this.Professor_UniversityModel.insert({ user_id, ...data })

        await this.updateAccessTokenData(user_id, user_roles)
      } else await this.Professor_UniversityModel.insert({ user_id, ...data })

      await this.EmailModel.commitTrx()
    }
  }

  async createModerator(user_id: number, user_roles: RoleTypes[], data: any) {
    new ValSchema({ university_id: P.joi.number().positive().required(), pretext: P.joi.string().allow(null, '') }).validate(data)

    const { university_id, pretext } = data

    const [prof_uni] = await this.Professor_UniversityModel.find({ user_id, university_id })

    if (prof_uni.full_time) {
      await this.Moderator_UniversityModel.insert({ user_id, university_id })

      if (!user_roles.some((role: string) => role === 'moderator')) {
        user_roles.push('moderator')
        await this.RoleModel.update({ user_id }, { moderator: true })
        await this.updateAccessTokenData(user_id, user_roles)
      }
    } else {
      if (!pretext) throw new ArisError('Professor that isn´t full time needs to provide a pretext!', 403)
      await this.RoleRequestModel.insert({
        user_id,
        role: 'moderator',
        data: JSON.stringify(data),
        status: 'awaiting',
        feedback: null
      })
    }
  }

  // Update
  async update(primary: any, update_data: any) {
    new ValSchema({ id: P.joi.number().positive().required(), user_id: P.joi.number().positive().required() }).validate(primary)

    const [request] = await this.RoleRequestModel.find(primary)
    if (!request) throw new ArisError('Request not found!', 400)

    switch (request.role) {
      case 'student':
        return this.updateStudent(request, update_data)

      case 'professor':
        return this.updateProfessor(request, update_data)

      case 'moderator':
        return this.updateModerator(request, update_data)
    }
  }

  private async updateStudent(request: any, update_data: any) {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      semester: P.joi.number().min(1).max(10)
    }).validate(update_data)

    const { id, user_id, data } = request
    const { voucher } = update_data
    delete update_data.voucher

    const { voucher_uuid: old_uuid } = request.data
    if (voucher && old_uuid) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      update_data.voucher_uuid = await file.update('documents', old_uuid)
    }

    await this.RoleRequestModel.update({ id, user_id }, { data: JSON.stringify({ ...data, ...update_data }), status: 'awaiting' })
  }

  private async updateProfessor(request: any, update_data: any) {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      full_time: P.joi.bool()
    }).validate(update_data)

    const { id, user_id, data } = request
    const { voucher } = update_data
    delete update_data.voucher

    const { voucher_uuid: old_uuid } = request.data
    if (voucher && old_uuid) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      update_data.voucher_uuid = await file.update('documents', old_uuid)
    }

    await this.RoleRequestModel.update({ id, user_id }, { data: JSON.stringify({ ...data, ...update_data }), status: 'awaiting' })
  }

  private async updateModerator(request: any, update_data: any) {
    new ValSchema({
      pretext: P.joi.string().allow(null)
    }).validate(update_data)

    const { id, user_id, data } = request

    await this.RoleRequestModel.update({ id, user_id }, { data: JSON.stringify({ ...data, ...update_data }), status: 'awaiting' })
  }

  // ---
  async accept(request_id: number) {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await this.RoleRequestModel.find({ id: request_id, status: ['awaiting', 'rejected'] })
    if (!request) throw new ArisError('Request not found!', 400)

    const { user_id, role: req_role } = request

    await this.RoleModel.createTrx()

    const [roles] = await this.RoleModel.find({ user_id }).select(
      'developer',
      'guest',
      'student',
      'professor',
      'customer',
      'evaluator',
      'moderator',
      'administrator'
    )
    const user_roles = Object.keys(roles).filter(key => roles[key] === 1) as RoleTypes[]

    if (!user_roles.some((role: string) => role === req_role)) {
      const index = user_roles.findIndex((role: string) => role === 'guest')
      index ? (user_roles[index] = req_role) : user_roles.push(req_role)

      await this.RoleModel.update({ user_id }, { guest: false, [req_role]: true })
    }

    switch (req_role) {
      case 'professor': {
        if (!request.data) throw new ArisError(`Couldn´t find professor role request data`, 500)
        const { university_id, campus_id, course_id, full_time, register } = request.data
        await this.ProfessorModel.insert({ user_id, postgraduate: null, linkedin: null, lattes: null, orcid: null })
        await this.Professor_UniversityModel.insert({ user_id, university_id, campus_id, course_id, full_time, register })
        break
      }

      case 'student': {
        if (!request.data) throw new ArisError(`Couldn´t find student role request data`, 500)
        const { university_id, campus_id, course_id, semester, register } = request.data
        await this.StudentModel.insert({ user_id, linkedin: null, lattes: null })
        await this.Student_UniversityModel.insert({ user_id, university_id, campus_id, course_id, semester, register })
      }

      case 'moderator': {
        if (!request.data) throw new ArisError(`Couldn´t find moderator role request data`, 500)
        const { university_id } = request.data
        await this.Moderator_UniversityModel.insert({ user_id, university_id })
        break
      }
    }

    await this.RoleRequestModel.update({ id: request_id, user_id }, { status: 'accepted' })

    await this.RoleModel.commitTrx()

    await this.updateAccessTokenData(user_id, user_roles)
  }

  async reject(request_id: number, feedback: string) {
    new ValSchema({ request_id: P.joi.number().positive().required(), feedback: P.joi.string().allow(null) }).validate({ request_id, feedback })

    const [request] = await this.RoleRequestModel.find({ id: request_id, status: 'awaiting' })
    if (!request) throw new ArisError('Request not found!', 400)

    await this.RoleRequestModel.update({ id: request_id, user_id: request.user_id }, { status: 'rejected', feedback })

    const [{ address: email_address }] = await EmailModel.find({ user_id: request.user_id, main: true })
    emitter.emit('Role_Req_Reject', { email_address, feedback })
  }

  async delete(request_id: number) {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await this.RoleRequestModel.find({ id: request_id })
    if (!request) throw new ArisError('Request not found!', 400)

    const { voucher_uuid } = request.data

    await this.RoleRequestModel.delete({ id: request_id, user_id: request.user_id })

    voucher_uuid && (await File.delete('documents', voucher_uuid))
  }

  async find(filter: any, { page, per_page }: Pagination) {
    new ValSchema({
      id: P.filter.ids.allow(null),
      user_id: P.filter.ids.allow(null),
      status: P.filter.string.allow(null),
      created_at: P.filter.date.allow(null),
      updated_at: P.filter.date.allow(null)
    }).validate(filter)

    const requests = await this.RoleRequestModel.find(filter)
      .select('id', 'user_id', 'role', 'status', 'data', 'feedback', 'created_at', 'updated_at')
      .paginate(page, per_page)
    return requests
  }

  async getVoucher(uuid: string) {
    new ValSchema(P.joi.string().required()).validate(uuid)

    const url = await File.get('documents', uuid)
    return url
  }

  private async updateAccessTokenData(user_id: number, roles: RoleTypes[]) {
    await Redis.client.setAsync(
      `auth:data:${user_id}`,
      JSON.stringify({
        user_id,
        roles
      })
    )
  }
}

export default new Role_RequestSubService(
  RoleModel,
  EmailModel,
  StudentModel,
  ProfessorModel,
  UniversityModel,
  RoleRequestModel,
  Student_UniversityModel,
  Professor_UniversityModel,
  Moderator_UniversityModel
)
