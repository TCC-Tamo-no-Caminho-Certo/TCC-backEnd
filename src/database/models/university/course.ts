import { CourseTypes } from '../../../@types/types'
import { Model, Increment, IModel } from '..'

interface Course {
  id: Increment
  name: CourseTypes
}

const CourseModel = new Model<Course, never>('course', { increment: 'id' }, true)

type ICourseModel = IModel<Course, never>

export { CourseModel, ICourseModel }
