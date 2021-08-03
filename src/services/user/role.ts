import { Moderator_UniversityModel, IModerator_UniversityModel } from '../../database/models/user/moderator_university'
import { Professor_UniversityModel, IProfessor_UniversityModel } from '../../database/models/user/professor_university'
import { Student_UniversityModel, IStudent_UniversityModel } from '../../database/models/user/student_university'
import { UniversityModel, IUniversityModel } from '../../database/models/university/university'
import { ProfessorModel, IProfessorModel } from '../../database/models/user/professor'
import { StudentModel, IStudentModel } from '../../database/models/user/student'
import { RoleModel, IRoleModel } from '../../database/models/user/role'
import Role_RequestSubService from './role_request'
import Redis from '../redis'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import { emitter } from '../../subscribers'

import { Pagination, RoleTypes } from '../../@types/types'

export class RoleSubService {
  private Moderator_UniversityModel: IModerator_UniversityModel
  private Professor_UniversityModel: IProfessor_UniversityModel
  private Student_UniversityModel: IStudent_UniversityModel
  private UniversityModel: IUniversityModel
  private ProfessorModel: IProfessorModel
  private StudentModel: IStudentModel
  private RoleModel: IRoleModel

  public request: typeof Role_RequestSubService

  constructor(
    Role: IRoleModel,
    Student: IStudentModel,
    Professor: IProfessorModel,
    University: IUniversityModel,
    Student_University: IStudent_UniversityModel,
    Professor_University: IProfessor_UniversityModel,
    Moderator_University: IModerator_UniversityModel,
    request_sub: typeof Role_RequestSubService
  ) {
    this.Moderator_UniversityModel = Moderator_University
    this.Professor_UniversityModel = Professor_University
    this.Student_UniversityModel = Student_University
    this.UniversityModel = University
    this.ProfessorModel = Professor
    this.StudentModel = Student
    this.RoleModel = Role

    this.request = request_sub
  }

  async update(user_id: any, role: string, role_data: any) {
    new ValSchema({
      user_id: P.joi.number().positive().required(),
      role: P.joi.string().equal('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator').required(),
      role_data: P.joi
        .when('role', { is: 'student', then: P.joi.object({ lattes: P.joi.string().allow(null), linkedin: P.joi.string().allow(null) }).required() })
        .when('role', {
          is: 'professor',
          then: P.joi
            .object({
              lattes: P.joi.string().allow(null),
              linkedin: P.joi.string().allow(null),
              orcid: P.joi.string().allow(null),
              postgraduate: P.joi.bool().allow(null)
            })
            .required()
        })
    }).validate({ user_id, role, role_data })

    switch (<RoleTypes>role) {
      case 'student':
        await this.StudentModel.update({ user_id }, role_data)
        break

      case 'professor':
        await this.ProfessorModel.update({ user_id }, role_data)
        break

      default:
        throw new ArisError(`Update role ${role} not implemented!`, 500)
    }
  }

  async remove(user_id: any, role: string) {
    new ValSchema({
      user_id: P.joi.number().positive().required(),
      role: P.joi.string().equal('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator').required()
    }).validate({ user_id, role })

    switch (<RoleTypes>role) {
      case 'student':
        await this.StudentModel.delete({ user_id })
        break

      case 'professor':
        await this.ProfessorModel.delete({ user_id })
        break

      case 'moderator':
        await this.Moderator_UniversityModel.query.del().where({ user_id })
        break

      default:
        throw new ArisError(`Delete role ${role} not implemented!`, 500)
    }

    const [roles] = await this.RoleModel.find({ user_id }).select('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator')
    const user_roles = Object.keys(roles).filter(key => roles[key] === 1 && key !== role) as RoleTypes[]

    user_roles.length === 0 && user_roles.push('guest')

    await this.updateAccessTokenData(user_id, user_roles)
  }

  async find(filter: any, { page, per_page }: Pagination) {
    new ValSchema({
      user_id: P.filter.ids.allow(null)
    }).validate(filter)

    const roles = await this.RoleModel.find(filter).paginate(page, per_page)
    const users_role = roles.map(({ user_id, ...role_array }) => ({
      user_id,
      roles: Object.keys(role_array).filter(key => (<any>role_array)[key] === 1) as RoleTypes[]
    }))

    return users_role
  }

  async findRoleData(user_id: number, role: string) {
    new ValSchema({
      user_id: P.joi.number().positive().required(),
      role: P.joi.string().equal('admin', 'guest', 'student', 'professor', 'customer', 'evaluator', 'moderator').required()
    }).validate({ user_id, role })

    switch (<RoleTypes>role) {
      case 'student': {
        let result: any = {}
        const [student] = await this.StudentModel.find({ user_id })
        const universities = this.parseUniversities(await this.Student_UniversityModel.find({ user_id }))
        result = { ...student }
        result.universities = universities
        return result
      }

      case 'professor': {
        let result: any = {}
        const [professor] = await this.ProfessorModel.find({ user_id })
        const universities = this.parseUniversities(await this.Professor_UniversityModel.find({ user_id }))
        result = { ...professor }
        result.universities = universities
        return result
      }

      case 'moderator': {
        let result: any = {}
        const universities = this.parseUniversities(await this.Moderator_UniversityModel.find({ user_id }))
        result.universities = universities
        return result
      }

      default:
        throw new ArisError(`Get role ${role} not implemented!`, 500)
    }
  }

  async findUniversities(user_id: number) {
    new ValSchema(P.joi.number().positive().required()).validate(user_id)

    const ids = await this.Moderator_UniversityModel.query
      .select('university_id')
      .where({ user_id })
      .union(
        this.Student_UniversityModel.query.select('university_id').where({ user_id }) as any,
        this.Professor_UniversityModel.query.select('university_id').where({ user_id }) as any
      )
      .then(rows => rows.map(row => row.university_id))

    const universities = this.UniversityModel.findCache(['id', 'name'], { id: ids })

    return universities
  }

  private parseUniversities(role_university: { user_id: number; university_id: number; [Key: string]: any }[]) {
    return role_university.map(({ university_id, user_id, ...data }) => ({
      university_id,
      name: this.UniversityModel.cache.find(university => university.id === university_id)!.name,
      ...data
    }))
  }

  private async updateAccessTokenData(user_id: number, roles: RoleTypes[]) {
    await Redis.client.setAsync(
      `auth:data:${user_id}`,
      JSON.stringify({
        id: user_id,
        roles
      })
    )
  }
}

export default new RoleSubService(
  RoleModel,
  StudentModel,
  ProfessorModel,
  UniversityModel,
  Student_UniversityModel,
  Professor_UniversityModel,
  Moderator_UniversityModel,
  Role_RequestSubService
)
