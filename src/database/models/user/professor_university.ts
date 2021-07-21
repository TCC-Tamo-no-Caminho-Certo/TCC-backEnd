import { Model, Foreign, IModel } from '..'

interface Professor_University {
  user_id: Foreign
  course_id: Foreign
  campus_id: Foreign
  university_id: Foreign
  register: number
  full_time: boolean
}

type Professor_UniversityUp = Partial<Omit<Professor_University, 'user_id' | 'university_id'>>

const Professor_UniversityModel = new Model<Professor_University, Professor_UniversityUp>('professor_university', {
  foreign: ['user_id', 'university_id', 'campus_id', 'course_id']
})

type IProfessor_UniversityModel = IModel<Professor_University, Professor_UniversityUp>

export { Professor_UniversityModel, IProfessor_UniversityModel }
