import University, { UniversityCtor, UniversityFilters } from '../database/models/university/university'
import Campus, { FormattedCampus } from './campus'
import { Transaction } from 'knex'
import db from '../database'

type FormattedUniversity = Omit<University, 'insert' | 'update' | 'delete'> & { campus: FormattedCampus[] }

export default class ArisUniversity {
  private university: University
  private campus: Campus[]

  private txn?: Transaction

  constructor(university: University, campus: Campus[]) {
    this.university = university
    this.campus = campus
  }

  static async createUniversity(university_info: UniversityCtor, campus: Campus[]) {
    const university = new University(university_info)
    await university.insert()

    return new ArisUniversity(university, campus)
  }

  /**
   * returns a parameter of university.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedUniversity>(key: T): FormattedUniversity[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of university infos.
   */
  format() {
    const aux_ob: FormattedUniversity = { ...this.university, campus: this.campus.map(camp => camp.format()) }
    return aux_ob
  }

  static async get(university_id: number) {
    const university = await University.get(university_id)
    const campus = await Campus.getUniversityCampus(university_id)

    return new ArisUniversity(university, campus)
  }

  static async getAll(filters: UniversityFilters, page: number, formatted?: boolean) {
    const universities = await University.getAll(filters, page)
    const ids = universities.map(university => university.university_id)
    const campus = await Campus.getUniversitiesCampus(ids)

    return universities.map(university => {
      const camp = campus.filter(camp => camp.get('university_id') === university.university_id)
      return formatted ? new ArisUniversity(university, camp).format() : new ArisUniversity(university, camp)
    })
  }

  // -----UNIVERSITY----- //

  async update({ name, professor_regex, student_regex }: Partial<Omit<UniversityCtor, 'university_id'>>) {
    if (name) this.university.name = name
    if (professor_regex) this.university.professor_regex = new RegExp(professor_regex)
    if (student_regex) this.university.student_regex = new RegExp(student_regex)

    await this.university.update()
  }

  async deleteUniversity() {
    await this.university.delete()
  }
}
