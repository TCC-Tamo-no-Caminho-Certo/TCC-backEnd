import { Model, Foreign, IModel } from '..'

interface Student_University {
  user_id: Foreign
  course_id: Foreign
  campus_id: Foreign
  university_id: Foreign
  register: number
  semester: number
}

type Student_UniversityUp = Partial<Omit<Student_University, 'user_id' | 'university_id'>>

const Student_UniversityModel = new Model<Student_University, Student_UniversityUp>('student_university', {
  foreign: ['user_id', 'university_id', 'campus_id', 'course_id']
})

type IStudent_UniversityModel = IModel<Student_University, Student_UniversityUp>

export { Student_UniversityModel, IStudent_UniversityModel }
