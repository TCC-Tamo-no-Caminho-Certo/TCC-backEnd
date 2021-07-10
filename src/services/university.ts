import { Campus_CourseModel, ICampus_CourseModel } from '../database/models/university/campus_course'
import { UniversityModel, IUniversityModel } from '../database/models/university/university'
import { CampusModel, ICampusModel } from '../database/models/university/campus'
import { SeasonModel, ISeasonModel } from '../database/models/university/season'
import { CourseModel, ICourseModel } from '../database/models/university/course'

import ValSchema, { P } from '../utils/validation'
import ArisError from '../utils/arisError'
import { emitter } from '../subscribers'

export class UniversityService {
  private Campus_CourseModel: ICampus_CourseModel
  private UniversityModel: IUniversityModel
  private SeasonModel: ISeasonModel
  private CampusModel: ICampusModel
  private CourseModel: ICourseModel

  constructor(Campus_Course: ICampus_CourseModel, University: IUniversityModel, Campus: ICampusModel, Course: ICourseModel, Season: ISeasonModel) {
    this.Campus_CourseModel = Campus_Course
    this.UniversityModel = University
    this.SeasonModel = Season
    this.CampusModel = Campus
    this.CourseModel = Course
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

  async find() {
    const universities = this.UniversityModel.cache
    return universities
  }

  // --------------------Season-------------------- //
  async addSeason(season_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      title: P.joi.string().required(),
      description: P.joi.string().allow(null),
      current_period: P.joi.string().equal('dispatch', 'evaluate', 'confirm', 'in_progress', 'complete'),
      dispatch: P.joi.date().required(),
      evaluate: P.joi.date().required(),
      confirm: P.joi.date().required(),
      in_progress: P.joi.date().required(),
      complete: P.joi.date().required()
    }).validate(season_data)

    const has_season = await this.SeasonModel.find({ university_id: season_data.university_id })
    if (has_season) throw new ArisError('University already has a season', 400) // Database / ArisError should handle this

    const response = await this.SeasonModel.insert(season_data)
    return response
  } // thing inside

  async updateSeason(primary: any, season_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      title: P.joi.string().required(),
      description: P.joi.string().allow(null),
      current_period: P.joi.string().equal('dispatch', 'evaluate', 'confirm', 'in_progress', 'complete'),
      dispatch: P.joi.date().required(),
      evaluate: P.joi.date().required(),
      confirm: P.joi.date().required(),
      in_progress: P.joi.date().required(),
      complete: P.joi.date().required()
    }).validate(season_data)

    const response = await this.SeasonModel.update(primary, season_data)
    return response
  }

  async findSeason() {
    const season = this.SeasonModel.find()
    return season
  }

  // --------------------Campus-------------------- //
  async addCampus(campus_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      name: P.joi.string().required()
    }).validate(campus_data)

    const response = await this.CampusModel.insert(campus_data)
    return response
  }

  async updateCampus(primary: any, campus_data: any) {
    new ValSchema({
      primary: P.joi.object({
        university_id: P.joi.number().positive().required(),
        campus_id: P.joi.number().positive().required()
      }),
      campus_data: P.joi.object({
        name: P.joi.string().required()
      })
    }).validate({ primary, campus_data })

    const response = await this.CampusModel.update(primary, campus_data)
    return response
  }

  async removeCampus(primary: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required()
    }).validate(primary)

    await this.CampusModel.delete(primary)
  }

  async findCampus() {
    const campus = this.CampusModel.cache
    return campus
  }

  // --------------------Campus-------------------- //
  async addCourse(course_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required()
    }).validate(course_data)

    const response = await this.Campus_CourseModel.insert(course_data)
    return response
  }

  async removeCourse(primary: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required()
    }).validate(primary)

    await this.Campus_CourseModel.delete(primary)
  }

  async findCourse() {
    const courses = this.Campus_CourseModel.cache
    return this.parseCourse(courses)
  }

  private parseCourse(campus_course_data: { campus_id: number; course_id: number }[]) {
    return campus_course_data.map(({ campus_id, course_id }) => ({
      campus_id,
      name: this.CourseModel.cache.find(course => course.id === course_id)!.name
    }))
  }
}

// class SeasonSubService {
//   private SeasonModel: ISeasonModel

//   constructor(Season: ISeasonModel) {
//     this.SeasonModel = Season
//   }
// }

// class CampusSubService {
//   private CampusModel: ICampusModel

//   public course: CourseSubService

//   constructor(Campus: ICampusModel, Campus_Course: ICampus_CourseModel, Course: ICourseModel) {
//     this.CampusModel = Campus

//     this.course = new CourseSubService(Campus_Course, Course)
//   }
// }

// class CourseSubService {
//   private Campus_CourseModel: ICampus_CourseModel
//   private CourseModel: ICourseModel

//   constructor(Campus_Course: ICampus_CourseModel, Course: ICourseModel) {
//     this.Campus_CourseModel = Campus_Course
//     this.CourseModel = Course
//   }
// }

export default new UniversityService(Campus_CourseModel, UniversityModel, CampusModel, CourseModel, SeasonModel)
