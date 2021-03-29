import RoleReq, { RoleReqCtor, RoleReqFilters } from '../../database/models/user/role_request'
import ArisError from '../arisError'
import Professor from './professor'
import Student from './student'
import RoleMan from './roleMan'

import { Pagination, RoleTypes } from '../../types'

import { Transaction } from 'knex'
import db from '../../database'

type ProfessorCtor = Parameters<typeof Professor.create>[0]
type Professor_CouseCtor = Parameters<typeof Professor.Course.add>[0]
type ProfessorData = ProfessorCtor & Professor_CouseCtor
type StudentCtor = Parameters<typeof Student.create>[0]
type Student_CourseCtor = Parameters<typeof Student.Course.add>[0]
type StudentData = StudentCtor & Student_CourseCtor

type GetRoleReq = Required<Omit<RoleReqCtor, 'data' | 'voucher_uuid' | 'feedback'>> & Pick<RoleReqCtor, 'data' | 'voucher_uuid' | 'feedback'>

export default class ArisRoleReq extends RoleReq {
  private txn?: Transaction

  /**
   * Creates an new role request.
   * @param user_id User id whose role will be requested
   * @param user_roles User roles
   * @param role Role to be Requested
   * @param role_info Role info if needed
   */
  static async create(user_id: number, role: 'professor', data: Omit<ProfessorData, 'user_id'>, voucher_uuid?: string): Promise<void>
  static async create(user_id: number, role: 'student', data: Omit<StudentData, 'user_id'>, voucher_uuid?: string): Promise<void>
  static async create<T extends Exclude<RoleTypes, 'professor' | 'student'>>(user_id: number, role: T): Promise<void>
  static async create<T extends RoleTypes>(
    user_id: number,
    role: T,
    data?: T extends 'professor' ? Omit<ProfessorCtor, 'user_id'> : T extends 'student' ? Omit<StudentCtor, 'user_id'> : never,
    voucher_uuid?: string
  ): Promise<void> {
    const role_id = RoleMan.find(role).get('role_id')

    const request = new ArisRoleReq({ user_id, role_id, data, voucher_uuid })
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
      voucher_uuid: this.voucher_uuid,
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
  async update({ data, voucher_uuid, feedback }: Partial<Pick<RoleReqCtor, 'data' | 'voucher_uuid' | 'feedback'>>) {
    if (data) this.data = data
    if (voucher_uuid) this.voucher_uuid = voucher_uuid
    if (feedback) this.feedback = feedback

    await this._update(this.txn)
  }

  async delete() {
    await this._delete(this.txn)
  }

  async accept(user_roles: RoleTypes[]) {
    if (user_roles.some(role => role === 'guest')) {
      await this.n_update(RoleMan.find('guest').get('role_id'), this.txn)
      user_roles = user_roles.filter(role => (role === 'guest' ? RoleMan.find(this.role_id).get('title') : role))
    } else {
      await this.n_insert(this.txn)
      user_roles.push(RoleMan.find(this.role_id).get('title'))
    }

    if (RoleMan.find(this.role_id).get('title') === 'professor') {
      if (!this.data) throw new ArisError('Couldn´t find professor role request data', 500)
      await Professor.create({
        user_id: this.user_id,
        postgraduate: this.data.postgraduate,
        linkedin: this.data.linkedin,
        lattes: this.data.lattes,
        orcid: this.data.orcid
      })
      await Professor.Course.add({
        user_id: this.user_id,
        campus_id: this.data.campus_id,
        course_id: this.data.course_id,
        full_time: this.data.full_time
      })
    }
    if (RoleMan.find(this.role_id).get('title') === 'student') {
      if (!this.data) throw new ArisError('Couldn´t find student role request data', 500)
      await Student.create({ user_id: this.user_id, linkedin: this.data.linkedin, lattes: this.data.lattes })
      await Student.Course.add({
        user_id: this.user_id,
        campus_id: this.data.campus_id,
        course_id: this.data.course_id,
        register: this.data.register,
        semester: this.data.semester
      })
    }

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
