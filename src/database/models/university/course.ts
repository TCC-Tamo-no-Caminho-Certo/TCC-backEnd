import ArisError from '../../../utils/arisError'
import { CourseTypes } from '../../../@types/types'
import { Model, Increment, IModel } from '..'
import db from '../..'

let courses: Required<CourseCtor>[] = []

db('course').then(row => {
  if (!row) throw new ArisError('Couldn´t get all courses', 500)
  courses.push(...row)
})

export interface CourseCtor {
  course_id?: number
  name: CourseTypes
}

export default class Course1 {
  protected course_id: number
  protected name: CourseTypes

  /**
   * Creates a course.
   */
  protected constructor({ course_id, name }: CourseCtor) {
    this.course_id = course_id || 0 //Gives a temporary id when creating a new course
    this.name = name
  }

  protected static _find(identifier: CourseTypes | number) {
    const course = courses.find(course => (typeof identifier === 'string' ? course.name === identifier : course.course_id === identifier))
    if (!course) throw new ArisError(`Course provided does't exists!`, 400)
    return course
  }

  protected static _findAll() {
    return courses
  }
}

// --------------- //

interface Course {
  id: Increment
  name: CourseTypes
}

const CourseModel = new Model<Course, never>('course', { increment: 'id' }, true)

type ICourseModel = IModel<Course, never>

export { CourseModel, ICourseModel }
