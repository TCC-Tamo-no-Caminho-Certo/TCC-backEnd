import RoleReq, { RoleReqCtor, RoleReqFilters } from '../../database/models/user/role_request'
import Role from '../../database/models/user/role'
import ArisError from '../arisError'
import Professor from './professor'
import Student from './student'

import { Pagination, RoleTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type Parameter<T extends (args: any) => any> = T extends (args: infer P) => any ? P : never
type ProfessorCtor = Parameter<typeof Professor.create>
type StudentCtor = Parameter<typeof Student.create>

type GetRoleReq = Required<Omit<RoleReqCtor, 'data' | 'doc_uuid' | 'feedback'>> & Pick<RoleReqCtor, 'data' | 'doc_uuid' | 'feedback'>

export default class ArisRoleReq extends RoleReq {
  private txn?: Transaction

  /**
   * Creates an new role request.
   * @param user_id User id whose role will be requested
   * @param user_roles User roles
   * @param role Role to be Requested
   * @param role_info Role info if needed
   */
  static async create(user_id: number, role: 'professor', data: Omit<ProfessorCtor, 'user_id'>, doc_uuid?: string): Promise<void>
  static async create(user_id: number, role: 'student', data: Omit<StudentCtor, 'user_id'>, doc_uuid?: string): Promise<void>
  static async create<T extends Exclude<RoleTypes, 'professor' | 'student'>>(user_id: number, role: T): Promise<void>
  static async create<T extends RoleTypes>(
    user_id: number,
    role: T,
    data?: T extends 'professor' ? Omit<ProfessorCtor, 'user_id'> : T extends 'student' ? Omit<StudentCtor, 'user_id'> : never,
    doc_uuid?: string
  ): Promise<void> {
    const { role_id } = Role.find(role)

    const request = new ArisRoleReq({ user_id, role_id, data, doc_uuid })
    await request._insert()
  }

  /**
   * returns a parameter of role request.
   * @param key -parameter to be returned.
   */
  get<T extends keyof GetRoleReq>(key: T): GetRoleReq[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of role request infos.
   */
  format() {
    const aux_ob: GetRoleReq = {
      request_id: this.request_id,
      user_id: this.user_id,
      role_id: this.role_id,
      data: this.data,
      doc_uuid: this.doc_uuid,
      feedback: this.feedback,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
    return aux_ob
  }

  static async find<T extends RoleReqFilters>(filters: T, pagination?: Pagination) {
    const requests = await RoleReq._find(filters, pagination)

    return <T extends { request_id: number } ? [ArisRoleReq] : ArisRoleReq[]>requests.map(request => new ArisRoleReq(request))
  }

  /**
   * Updates the role request info.
   */
  async update({ data, doc_uuid, feedback }: Partial<Pick<RoleReqCtor, 'data' | 'doc_uuid' | 'feedback'>>) {
    if (data) this.data = data
    if (doc_uuid) this.doc_uuid = doc_uuid
    if (feedback) this.feedback = feedback

    await this._update(this.txn)
  }

  async delete() {
    await this._delete(this.txn)
  }

  async accept(user_roles: RoleTypes[]) {
    if (user_roles.some(role => role === 'guest')) {
      await this.n_update(Role.find('guest').role_id, this.txn)
      user_roles = user_roles.filter(role => (role === 'guest' ? Role.find(this.role_id).title : role))
    } else {
      await this.n_insert(this.txn)
      user_roles.push(Role.find(this.role_id).title)
    }

    Role.find(this.role_id).title === 'professor'
      ? await Professor.create({ user_id: this.user_id, ...(<any>this.data) })
      : Role.find(this.role_id).title === 'student'
      ? await Student.create({ user_id: this.user_id, ...(<any>this.data) })
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
   * Creates a database transaction.
   */
  async createTxn() {
    this.txn = await db.transaction()
  }

  /**
   * Bind a transaction to this class.
   */
  setTxn(txn: Transaction) {
    this.txn = txn
  }

  /**
   * Commits the transaction.
   */
  async commitTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.commit()
  }

  /**
   * Rollback the transaction.
   */
  async rollbackTxn() {
    if (!this.txn) throw new ArisError('Transaction wasn´t created!', 500)
    await this.txn.rollback()
  }
}
