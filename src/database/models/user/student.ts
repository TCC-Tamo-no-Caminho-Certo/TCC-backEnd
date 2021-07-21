import { Model, Foreign, IModel } from '..'

interface Student {
  user_id: Foreign
  linkedin: string | null
  lattes: string | null
}

const StudentModel = new Model<Student>('student', { foreign: ['user_id'] })

type IStudentModel = IModel<Student>

export { StudentModel, IStudentModel }
