import { Moderator_UniversityModel, IModerator_UniversityModel } from '../../database/models/user/moderator_university'
import { Professor_UniversityModel, IProfessor_UniversityModel } from '../../database/models/user/professor_university'
import { Student_UniversityModel, IStudent_UniversityModel } from '../../database/models/user/student_university'
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

      const voucher_uuid = await file.insert('documents')

      await this.RoleRequestModel.insert({ user_id, role: 'student', data: JSON.stringify(data), status: 'awaiting', voucher_uuid, feedback: null })
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

      const voucher_uuid = await file.insert('documents')

      await this.RoleRequestModel.insert({ user_id, role: 'professor', data: JSON.stringify(data), status: 'awaiting', voucher_uuid, feedback: null })
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
        voucher_uuid: null,
        feedback: null
      })
    }
  }

  async updateStudent(primary: any, update_data: any) {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      semester: P.joi.number().min(1).max(10)
    }).validate(update_data)

    const { voucher } = update_data
    delete update_data.voucher

    const [request] = await this.RoleRequestModel.find(primary)
    if (!request) throw new ArisError('Request not found!', 400)

    let voucher_uuid = request.voucher_uuid
    if (voucher && voucher_uuid) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      voucher_uuid = await file.update('documents', voucher_uuid)
    }

    await this.RoleRequestModel.update(primary, { data: JSON.stringify(update_data), voucher_uuid, status: 'awaiting' })
  }

  async updateProfessor(primary: any, update_data: any) {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      full_time: P.joi.bool()
    }).validate(update_data)

    const { voucher } = update_data
    delete update_data.voucher

    const [request] = await this.RoleRequestModel.find(primary)
    if (!request) throw new ArisError('Request not found!', 400)

    let voucher_uuid = request.voucher_uuid
    if (voucher && voucher_uuid) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      voucher_uuid = await file.update('documents', voucher_uuid)
    }

    await this.RoleRequestModel.update(primary, { data: JSON.stringify(update_data), voucher_uuid, status: 'awaiting' })
  }

  async updateModerator(primary: any, update_data: any) {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      pretext: P.joi.string().allow(null)
    }).validate(update_data)

    const [request] = await this.RoleRequestModel.find(primary)
    if (!request) throw new ArisError('Request not found!', 400)

    await this.RoleRequestModel.update(primary, { data: JSON.stringify(update_data), status: 'awaiting' })
  }

  async accept(id: number) {
    new ValSchema(P.joi.number().positive().required()).validate(id)

    const [request] = await this.RoleRequestModel.find({ id, status: ['awaiting', 'rejected'] })
    if (!request) throw new ArisError('Request not found!', 400)

    const { user_id, role: r_role } = request

    await this.RoleModel.createTrx()

    const [roles] = await this.RoleModel.find({ user_id }).select('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator')
    const user_roles: any = Object.keys(roles).filter(key => (roles as any)[key] === 1)

    if (!user_roles.some((role: string) => role === r_role)) {
      const index = user_roles.findIndex((role: string) => role === 'guest')
      index ? (user_roles[index] = r_role) : user_roles.push(r_role)

      await this.RoleModel.update({ user_id }, { guest: false, [r_role]: true })
      await this.ProfessorModel.insert({ user_id, postgraduate: null, lattes: null, linkedin: null, orcid: null })
    }

    switch (r_role) {
      case 'professor':
        if (!request.data) throw new ArisError('Couldn´t find professor role request data', 500)
        await this.ProfessorModel.insert({ user_id, postgraduate: null, linkedin: null, lattes: null, orcid: null })
        await this.Professor_UniversityModel.insert({ user_id, ...(request.data as any) })
        break

      case 'student':
        if (!request.data) throw new ArisError('Couldn´t find student role request data', 500)
        await this.StudentModel.insert({ user_id, linkedin: null, lattes: null })
        await this.Student_UniversityModel.insert({ user_id, ...(request.data as any) })

      case 'moderator':
        if (!request.data) throw new ArisError('Couldn´t find moderator role request data', 500)
        await this.Moderator_UniversityModel.insert({ user_id, ...(request.data as any) })
        break
    }

    await this.RoleRequestModel.update({ id, user_id }, { status: 'accepted' })

    await this.RoleModel.commitTrx()

    await this.updateAccessTokenData(user_id, user_roles)
  }

  async reject(id: number, feedback: string) {
    new ValSchema({ id: P.joi.number().positive().required(), feedback: P.joi.string().allow(null) }).validate({ id, feedback })

    const [request] = await this.RoleRequestModel.find({ id, status: 'awaiting' })
    if (!request) throw new ArisError('Request not found!', 400)

    await this.RoleRequestModel.update({ id, user_id: request.user_id }, { status: 'rejected', feedback })

    // const [email] = await User.Email.find({ user_id: request.get('user_id'), main: true })
    // await Mail.roleReqReject({ to: email.get('address'), message: feedback })
  } // Incomplete (need to send email)

  async delete(id: number) {
    new ValSchema(P.joi.number().positive().required()).validate(id)

    const [request] = await this.RoleRequestModel.find({ id })
    if (!request) throw new ArisError('Request not found!', 400)

    const { voucher_uuid } = request

    await this.RoleRequestModel.delete({ id, user_id: request.user_id })

    voucher_uuid && (await File.delete('documents', voucher_uuid))
  }

  async find(filter: any, { page, per_page }: Pagination) {
    const requests = await this.RoleRequestModel.find(filter).paginate(page, per_page)
    return requests
  }

  private async updateAccessTokenData(user_id: number, roles: RoleTypes[]) {
    // await Redis.client.delAsync(`auth:data:${user_id}`)
    await Redis.client.setAsync(
      `auth:data:${user_id}`,
      JSON.stringify({
        id: user_id,
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
