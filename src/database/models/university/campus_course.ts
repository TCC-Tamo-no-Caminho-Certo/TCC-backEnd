import { Model, Foreign, IModel } from '..'

interface Campus_Course {
  university_id: Foreign
  campus_id: Foreign
  course_id: Foreign
}

const Campus_CourseModel = new Model<Campus_Course, never>('campus_course', { foreign: ['university_id', 'campus_id', 'course_id'] }, true)

type ICampus_CourseModel = IModel<Campus_Course, never>

export { Campus_CourseModel, ICampus_CourseModel }
