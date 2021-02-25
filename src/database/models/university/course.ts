import ArisError from '../../../utils/arisError'
import { CourseTypes } from '../../../types'
import db from '../..'

let courses: Required<CourseCtor>[]

db('course').then(row => {
  if (!row) throw new ArisError('Couldn´t get all courses', 500)
  courses.push(...row)
})

export interface CourseCtor {
  course_id?: number
  name: CourseTypes
}

export default class Course {
  course_id: number
  name: CourseTypes

  /**
   * Creates a course.
   */
  private constructor({ course_id, name }: CourseCtor) {
    this.course_id = course_id || 0 //Gives a temporary id when creating a new course
    this.name = name
  }

  static find(identifier: CourseTypes | number) {
    const course = courses.find(course => (typeof identifier === 'string' ? course.name === identifier : course.course_id === identifier))
    if (!course) throw new ArisError(`Course provided does't exists!`, 400)
    return course
  }

  static findAll() {
    return courses
  }
}