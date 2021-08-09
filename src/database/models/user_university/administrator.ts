import { Model, Foreign, IModel } from '..'

interface Administrator_University {
  user_id: Foreign
  university_id: Foreign
}

const Administrator_UniversityModel = new Model<Administrator_University, never>('administrator_university', { foreign: ['user_id', 'university_id'] })

type IAdministrator_UniversityModel = IModel<Administrator_University, never>

export { Administrator_UniversityModel, IAdministrator_UniversityModel }
