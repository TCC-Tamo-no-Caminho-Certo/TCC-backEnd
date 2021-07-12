import { ProfessorModel, IProfessorModel } from '../../database/models/user/professor'
import { StudentModel, IStudentModel } from '../../database/models/user/student'
import { RoleModel, IRoleModel } from '../../database/models/user/role'
import Role_RequestSubService from './role_request'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import { emitter } from '../../subscribers'

import { Pagination, RoleTypes } from '../../@types/types'

export class RoleSubService {
  private ProfessorModel: IProfessorModel
  private StudentModel: IStudentModel
  private RoleModel: IRoleModel

  public request: typeof Role_RequestSubService

  constructor(Role: IRoleModel, Student: IStudentModel, Professor: IProfessorModel, request_sub: typeof Role_RequestSubService) {
    this.ProfessorModel = Professor
    this.StudentModel = Student
    this.RoleModel = Role

    this.request = request_sub
  }

  // async add(user_id: number, role: RoleTypes, role_data?: any) {}

  async update(primary: any, role: RoleTypes, role_data: any) {}

  async remove(primary: any) {}

  async find(filter: any, { page, per_page }: Pagination) {}
}

export default new RoleSubService(RoleModel, StudentModel, ProfessorModel, Role_RequestSubService)
