import { RoleTypes } from '../../../@types/types'
import { Model, Foreign, IModel } from '..'

type RolesList = { [Key in RoleTypes]: boolean }

interface Role extends RolesList {
  user_id: Foreign
}

type RoleUp = Partial<Omit<Role, 'user_id'>>
type RoleIn = Pick<Role, 'user_id'>

const RoleModel = new Model<Role, RoleUp, RoleIn>('role', { foreign: ['user_id'] })

type IRoleModel = IModel<Role, RoleUp, RoleIn>

export { RoleModel, IRoleModel }
