import { Model, Foreign, IModel } from '..'

interface Professor {
  user_id: Foreign
  postgraduate: boolean | null
  linkedin: string | null
  lattes: string | null
  orcid: string | null
}

const ProfessorModel = new Model<Professor>('professor', { foreign: ['user_id'] })

type IProfessorModel = IModel<Professor>

export { ProfessorModel, IProfessorModel }
