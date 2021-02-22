import RoleReq, { RoleReqCtor, RoleReqFilters } from '../../database/models/user/roleReq'
import Role from '../../database/models/user/role'
import ArisError from '../arisError'
import Professor from './professor'
import Student from './student'

import { Transaction } from 'knex'
import db from '../../database'

type Parameter<T extends (args: any) => any> = T extends (args: infer P) => any ? P : never
type ProfessorCtor = Parameter<typeof Professor.create>
type StudentCtor = Parameter<typeof Student.create>

type FormattedRoleReq = Required<Omit<RoleReqCtor, 'data' | 'feedback'>> & Pick<RoleReqCtor, 'data' | 'feedback'>

export default class ArisRoleReq extends RoleReq {
  private txn?: Transaction

  /**
   * Creates an new role request.
   * @param user_id User id whose role will be requested
   * @param user_roles User roles
   * @param role Role to be Requested
   * @param role_info Role info if needed
   */
  static async create<T extends 'professor'>(user_id: number, user_roles: RoleTypes[], role: T, role_info: ProfessorCtor): Promise<void>
  static async create<T extends 'student'>(user_id: number, user_roles: RoleTypes[], role: T, role_info: StudentCtor): Promise<void>
  static async create<T extends RoleTypes>(
    user_id: number,
    user_roles: RoleTypes[],
    role: T,
    role_info?: T extends 'professor' ? ProfessorCtor : T extends 'student' ? StudentCtor : never
  ): Promise<void> {
    if (user_roles.some(user_role => user_role === role)) throw new ArisError('User already have this role!', 400)

    const { role_id } = Role.get(role)
    const data = role_info && JSON.stringify(role_info)

    const request = new ArisRoleReq({ user_id, role_id, data })
    await request._insert()
  }

  /**
   * returns a parameter of role request.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedRoleReq>(key: T): FormattedRoleReq[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role request infos.
   */
  format() {
    const aux_ob: FormattedRoleReq = {
      request_id: this.request_id,
      user_id: this.user_id,
      role_id: this.role_id,
      data: this.data,
      feedback: this.feedback,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
    return aux_ob
  }

  static async get<T extends RoleReqFilters>(filters: T, pagination?: Pagination) {
    const requests = await RoleReq._get(filters, pagination)

    return <T extends { request_id: number } ? [ArisRoleReq] : ArisRoleReq[]>requests.map(request => new ArisRoleReq(request))
  }

  /**
   * Updates the role request info.
   */
  async update({ data, feedback }: Partial<Pick<RoleReqCtor, 'data' | 'feedback'>>) {
    if (data) this.data = data
    if (feedback) this.feedback = feedback

    await this._update(this.txn)
  }

  async delete() {
    await super._delete(this.txn)
  }

  async accept(user_roles: RoleTypes[]) {
    if (user_roles.some(role => role === 'guest')) {
      await super.n_update(Role.get('guest').role_id, this.txn)
      user_roles = user_roles.filter(role => (role === 'guest' ? Role.get(this.role_id).title : role))
    } else {
      await super.n_insert(this.txn)
      user_roles.push(Role.get(this.role_id).title)
    }

    Role.get(this.role_id).title === 'professor'
      ? await Professor.create(JSON.parse(<string>this.data))
      : Role.get(this.role_id).title === 'student'
      ? await Student.create(JSON.parse(<string>this.data))
      : undefined

    this.status = 'accepted'
    await this._update(this.txn)

    return user_roles
  }

  async reject(feedback?: string) {
    this.status = 'rejected'
    if (feedback) this.feedback = feedback

    await this._update()
  }

  // -----TRANSACTION----- //

  /**
   * creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }
}
