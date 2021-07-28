import { Model, Increment, Foreign, IModel } from '..'
import { RoleTypes } from '../../../@types/types'

type RoleRequestStatus = 'accepted' | 'rejected' | 'awaiting'

interface RoleRequest {
  id: Increment
  user_id: Foreign
  role: RoleTypes
  data: { [key: string]: any }
  feedback: string | null
  status: RoleRequestStatus
  created_at: string
  updated_at: string
}

const RoleRequestModel = new Model<RoleRequest>('role_request', { increment: 'id', foreign: ['user_id'] })

type IRoleRequestModel = IModel<RoleRequest>

export { RoleRequestModel, IRoleRequestModel }
