import ArisError from '../../../utils/arisError'
import { Transaction } from 'knex'
import db from '../..'

export type CourseTypes =
  | 'Ciência da Computação'
  | 'Engenharia da Computação'
  | 'Engenharia Mecânica'
  | 'Engenharia de Produção'
  | 'Sistemas de Informação'

let courses: Course[]

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
  constructor({ course_id, name }: CourseCtor) {
    this.course_id = course_id || 0 //Gives a temporary id when creating a new course
    this.name = name
  }

  static get(identifier: CourseTypes | number) {
    const course = courses.find(course => (typeof identifier === 'string' ? course.name === identifier : course.course_id === identifier))
    if (!course) throw new ArisError(`Course provided does't exists!`, 400)
    return course
  }

  static async getAll() {
    const courses = await db('course').then(row => (row[0] ? row : false))
    return courses
  }

  // -----CAMPUS_COURSE----- //

  async linkWithCampus(campus_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('campus_course').insert({ course_id: this.course_id, campus_id })
  }

  async unLinkWithCampus(campus_id: number, transaction?: Transaction) {
    const trx = transaction || db

    await trx('campus_course').del().where({ course_id: this.course_id, campus_id })
  }

  static async getCampusCourses(campus_id: number) {
    const courses = await db('campus_course')
      .where({ campus_id })
      .then(row => (row[0] ? row : null))
    if (!courses) throw new ArisError('Couldn`t found campus`s courses!', 500)

    return courses.map(course => Course.get(course.course_id))
  }

  // -----USER_COURSE----- //

  async linkWithUser(user_id: number, campus_id: number, user_type: 'professor' | 'student', transaction?: Transaction) {
    const txn = transaction || db

    const campus_course_id = await txn('campus_course')
      .where({ campus_id, course_id: this.course_id })
      .then(row => (row[0] ? row[0].campus_course_id : null))
    if (!campus_course_id) throw new ArisError('Campus don`t have this course!', 400)

    await txn(`${user_type}_course`).insert({ [`${user_type}_id`]: user_id, campus_course_id })
  }

  async unLinkWithUser(user_id: number, campus_id: number, user_type: 'professor' | 'student', transaction?: Transaction) {
    const txn = transaction || db

    const campus_course_id = await txn('campus_course')
      .where({ campus_id, course_id: this.course_id })
      .then(row => (row[0] ? row[0].campus_course_id : null))
    if (!campus_course_id) throw new ArisError('Campus don`t have this course!', 400)

    await txn(`${user_type}_course`)
      .del()
      .where({ [`${user_type}_id`]: user_id, campus_course_id })
  }

  static async getUserCourses(user_id: number, user_type: 'professor' | 'student') {
    const result: { [campus_id: number]: Course[] } = {}
    const campus_course_ids = await db(`${user_type}_course`)
      .where({ [`${user_type}_id`]: user_id })
      .then(row => (row[0] ? row.map(campus_course => campus_course.campus_course_id) : null))
    if (!campus_course_ids) throw new ArisError('Couldn`t found user courses!', 500)

    const courses = await db('campus_course')
      .whereIn('campus_course_id', campus_course_ids)
      .then(row => (row[0] ? row : null))
    if (!courses) throw new ArisError('Couldn`t found campus courses!', 500)

    courses.map(course =>
      result[course.campus_id]
        ? result[course.campus_id].push(Course.get(course.course_id))
        : (result[course.campus_id] = [Course.get(course.course_id)])
    )

    return result
  }
}

Course.getAll().then(row => {
  if (!row) throw new ArisError('Couldn´t get all courses', 500)
  courses = row.map(course_info => new Course(course_info))
})
