import { EventEmitter } from 'events'
import { RoleTypes } from '../@types/types'

// [event name]: data
export interface Events {
  // Auth
  SingUp: {
    user_data: any
    email_address: string
    token: string
  }
  
  SingIn: {
    user_id: number
    roles: RoleTypes[]
    remember: boolean
  }

  SignOut: {
    token: string
  }

  ConfirmSingUp: {
    user_data: any
  }

  ForgotPassword: {
    email_address: string
    token: string
  }

  Email_Add: {
    email_address: string
    token: string
  }

  // User
  User_Update: {
    user_data: any
    update_data: any
  }

  User_Delete: {
    token: string
  }
}

class MyEmitter<T = Events> extends EventEmitter {
  constructor() {
    super()
  }

  on<K extends keyof T = keyof T>(event: K extends string | symbol ? K : never, listener: (args: T[K]) => void): this {
    return super.on(event, listener)
  }

  emit<K extends keyof T = keyof T>(event: K extends string | symbol ? K : never, args: T[K]): boolean {
    return super.emit(event, args)
  }

  // Add new functions as needed
}

export const emitter = new MyEmitter()

// load subscribers
import './nodemailer'
import './lucene'
