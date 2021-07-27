import { CampusModel, ICampusModel } from '../../database/models/university/campus'
import CourseSubService from './course'

import ValSchema, { P } from '../../utils/validation'

export class CampusSubService {
  private CampusModel: ICampusModel

  public course: typeof CourseSubService

  constructor(Campus: ICampusModel, course_sub: typeof CourseSubService) {
    this.CampusModel = Campus

    this.course = course_sub
  }

  async add(university_id: number, campus_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_data: P.joi.object({ name: P.joi.string().required() }).required()
    }).validate({ university_id, campus_data })

    const new_campus = await this.CampusModel.insert({ university_id, ...campus_data })
    return new_campus
  }

  async update(primary: any, campus_data: any) {
    new ValSchema({
      primary: P.joi.object({
        university_id: P.joi.number().positive().required(),
        campus_id: P.joi.number().positive().required()
      }),
      campus_data: P.joi.object({
        name: P.joi.string().required()
      })
    }).validate({ primary, campus_data })

    await this.CampusModel.update(primary, campus_data)
  }

  async remove(primary: any) {
    new ValSchema({
      id: P.joi.number().positive().required(),
      university_id: P.joi.number().positive().required()
    }).validate(primary)

    await this.CampusModel.delete(primary)
  }

  find(filter?: any) {
    const campus = this.CampusModel.findCache(filter)
    return campus
  }
}

export default new CampusSubService(CampusModel, CourseSubService)
