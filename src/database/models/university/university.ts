import { Model, Increment, IModel } from '..'

interface University_Regex {
  email: {
    student: string
    professor: string
  }
  register: {
    student: string
    professor: string
  }
}

interface University {
  id: Increment
  name: string
  regex: University_Regex
}

const UniversityModel = new Model<University>('university', { increment: 'id' }, true)

type IUniversityModel = IModel<University>

export { UniversityModel, IUniversityModel }
