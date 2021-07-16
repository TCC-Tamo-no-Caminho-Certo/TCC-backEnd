import { Campus_CourseModel, ICampus_CourseModel } from '../../database/models/university/campus_course'
import { CourseModel, ICourseModel } from '../../database/models/university/course'

import ValSchema, { P } from '../../utils/validation'

export class CourseSubService {
  private Campus_CourseModel: ICampus_CourseModel
  private CourseModel: ICourseModel

  constructor(Campus_Course: ICampus_CourseModel, Course: ICourseModel) {
    this.Campus_CourseModel = Campus_Course
    this.CourseModel = Course
  }

  async add(university_id: number, campus_id: number, course_id: number) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required()
    }).validate({ university_id, campus_id, course_id })

    const new_course = await this.Campus_CourseModel.insert({ university_id, campus_id, course_id })
    return new_course
  }

  async remove(primary: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required()
    }).validate(primary)

    await this.Campus_CourseModel.delete(primary)
  }

  getAll() {
    const courses = this.Campus_CourseModel.cache
    return this.parse(courses)
  }

  getByCampus(university_id: number, campus_id: number) {
    const courses = this.Campus_CourseModel.cache.filter(course => course.university_id === university_id && course.campus_id === campus_id)
    return this.parse(courses)
  }

  private parse(campus_course: { university_id: number; campus_id: number; course_id: number }[]) {
    return campus_course.map(({ university_id, campus_id, course_id }) => ({
      university_id,
      campus_id,
      name: this.CourseModel.cache.find(course => course.id === course_id)!.name
    }))
  }
}

export default new CourseSubService(Campus_CourseModel, CourseModel)
