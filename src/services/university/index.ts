import { UniversityModel, IUniversityModel } from '../../database/models/university/university'
import SeasonSubService from './season'
import CampusSubService from './campus'

import ValSchema, { P } from '../../utils/validation'

export class UniversityService {
  private UniversityModel: IUniversityModel

  public season: typeof SeasonSubService
  public campus: typeof CampusSubService

  constructor(University: IUniversityModel, season_sub: typeof SeasonSubService, campus_sub: typeof CampusSubService) {
    this.UniversityModel = University

    this.season = season_sub
    this.campus = campus_sub
  }

  async register(university_data: any) {
    new ValSchema({
      name: P.joi.string().required(),
      regex: P.joi
        .object({
          email: P.joi
            .object({
              professor: P.joi.string().required(),
              student: P.joi.string().required()
            })
            .required(),
          register: P.joi
            .object({
              professor: P.joi.string().required(),
              student: P.joi.string().required()
            })
            .required()
        })
        .required()
    }).validate(university_data)

    university_data.regex = JSON.stringify(university_data.regex)

    const response = await this.UniversityModel.insert(university_data)
    return response
  }

  async update(primary: any, university_data?: any) {
    new ValSchema({
      primary: P.joi
        .object({
          university_id: P.joi.number().integer().positive().required()
        })
        .required(),
      university_data: P.joi.object({
        name: P.joi.string(),
        regex: P.joi.object({
          email: P.joi
            .object({
              professor: P.joi.string().required(),
              student: P.joi.string().required()
            })
            .required(),
          register: P.joi
            .object({
              professor: P.joi.string().required(),
              student: P.joi.string().required()
            })
            .required()
        })
      })
    }).validate({ primary, university_data })

    await this.UniversityModel.update(primary, university_data)
  }

  async delete(primary: any) {
    new ValSchema({ university_id: P.joi.number().positive().required() }).validate(primary)

    await this.UniversityModel.delete(primary)
  }

  find(filter?: any) {
    new ValSchema({
      id: P.filter.ids.allow(null),
      name: P.filter.names.allow(null)
    }).validate(filter)

    const universities = this.UniversityModel.findCache(filter)
    return universities
  }
}

export default new UniversityService(UniversityModel, SeasonSubService, CampusSubService)
