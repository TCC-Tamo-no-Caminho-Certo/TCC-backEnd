import { Model, Increment, Foreign, IModel } from '..'

interface Campus {
  id: Increment
  university_id: Foreign
  name: string
}

const CampusModel = new Model<Campus>('campus', { increment: 'id', foreign: ['university_id'] }, true)

type ICampusModel = IModel<Campus>

export { CampusModel, ICampusModel }
