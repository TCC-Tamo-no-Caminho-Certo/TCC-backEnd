import { Model, Increment, IModel } from '..'

interface User {
  id: Increment
  name: string
  surname: string
  full_name: string
  phone: string | null
  birthday: string
  password: string
  avatar_uuid: string
  created_at: string
  updated_at: string
}

type UserUp = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
type UserIn = Omit<User, 'id' | 'avatar_uuid' | 'created_at' | 'updated_at'>

const UserModel = new Model<User, UserUp, UserIn>('user', { increment: 'id' })

type IUserModel = IModel<User, UserUp, UserIn>

export { UserModel, IUserModel }
