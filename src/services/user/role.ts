import { Moderator_UniversityModel, IModerator_UniversityModel } from '../../database/models/user/moderator_university'
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
  private ProfessorModel: IProfessorModel
  private StudentModel: IStudentModel
  private RoleModel: IRoleModel

  public request: typeof Role_RequestSubService

  constructor(
    Role: IRoleModel,
    Student: IStudentModel,
    Professor: IProfessorModel,
    Moderator_University: IModerator_UniversityModel,
    request_sub: typeof Role_RequestSubService
  ) {
    this.Moderator_UniversityModel = Moderator_University
    this.ProfessorModel = Professor
    this.StudentModel = Student
    this.RoleModel = Role

    this.request = request_sub
  }

  // Update
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

  // Remove
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

  // ---
  async find(filter: any, { page, per_page }: Pagination) {}

  async get(user_id: number, role: string) {}

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

export default new RoleSubService(RoleModel, StudentModel, ProfessorModel, Moderator_UniversityModel, Role_RequestSubService)
