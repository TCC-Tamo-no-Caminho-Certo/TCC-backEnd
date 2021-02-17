import Campus, { CampusCtor, CampusFilters } from '../database/models/university/campus'
import Course, { CourseCtor, CourseTypes } from '../database/models/university/course'
import ArisError from './arisError'
import { Transaction } from 'knex'
import db from '../database'

export type FormattedCampus = Omit<Campus, 'insert' | 'update' | 'delete'> & {
  courses: Omit<Course, 'insert' | 'update' | 'delete' | 'linkWithCampus' | 'unLinkWithCampus' | 'linkWithUser' | 'unLinkWithUser'>[]
}

export default class ArisCampus {
  private campus: Campus
  private courses: Course[]

  private txn?: Transaction

  constructor(campus: Campus, courses: Course[]) {
    this.campus = campus
    this.courses = courses
  }

  static async createCampus(campus_info: CampusCtor, courses_info: CourseCtor[]) {
    const txn = await db.transaction()

    const campus = new Campus(campus_info)
    await campus.insert(txn)
    const courses: Course[] = []
    for (const course_info of courses_info) {
      const course = new Course(course_info)
      await course.linkWithCampus(campus.campus_id, txn)
      courses.push(course)
    }

    await txn.commit()

    return new ArisCampus(campus, courses)
  }

  /**
   * returns a parameter of campus.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedCampus>(key: T): FormattedCampus[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of campus infos.
   */
  format() {
    const aux_ob: FormattedCampus = { ...this.campus, courses: this.courses }
    return aux_ob
  }

  static async get(campus_id: number) {
    const campus = await Campus.get(campus_id)
    const courses = await Course.getCampusCourses(campus_id)

    return new ArisCampus(campus, courses)
  }

  static async getAll(filters: CampusFilters, page: number, formatted?: boolean) {
    const campus = await Campus.getAll(filters, page)
    const ids = campus.map(camp => camp.campus_id)
    const courses = await Course.getAllCampusCourses(ids)

    return campus.map(camp => {
      const course = courses[camp.campus_id]
      return formatted ? new ArisCampus(camp, course).format() : new ArisCampus(camp, course)
    })
  }

  static async getUniversityCampus(university_id: number) {
    const campus = await Campus.getUniversityCampus(university_id)
    const ids = campus.map(camp => camp.campus_id)
    const courses = await Course.getAllCampusCourses(ids)

    return campus.map(camp => {
      const course = courses[camp.campus_id]
      return new ArisCampus(camp, course)
    })
  }

  static async getUniversitiesCampus(university_ids: number[]) {
    const campus = await Campus.getUniversitiesCampus(university_ids)
    const ids = campus.map(camp => camp.campus_id)
    const courses = await Course.getAllCampusCourses(ids)

    return campus.map(camp => {
      const course = courses[camp.campus_id]
      return new ArisCampus(camp, course)
    })
  }

  // -----CAMPUS----- //

  async updateCampus({ name }: Partial<Omit<CampusCtor, 'campus_id' | 'university_id'>>) {
    if (name) this.campus.name = name
    await this.campus.update()
  }

  async deleteCampus() {
    await this.campus.delete()
  }

  // -----COURSE----- //

  async addCourse(course_name: CourseTypes) {
    const course = Course.get(course_name)
    await course.linkWithCampus(this.campus.campus_id)
    this.courses.push(course)
  }

  async removeCourse(course_name: CourseTypes) {
    const r_course = Course.get(course_name)
    await r_course.unLinkWithCampus(this.campus.campus_id)
    this.courses = this.courses.filter(course => course.course_id !== r_course.course_id)
  }

  // -----TRANSACTION----- //

  /**
   * creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }
}
