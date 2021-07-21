import { Model, Foreign, IModel } from '..'

interface Moderator_University {
  user_id: Foreign
  university_id: Foreign
}

const Moderator_UniversityModel = new Model<Moderator_University, never>('moderator_university', { foreign: ['user_id', 'university_id'] })

type IModerator_UniversityModel = IModel<Moderator_University, never>

export { Moderator_UniversityModel, IModerator_UniversityModel }
