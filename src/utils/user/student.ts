import Student, { StudentCtor, StudentFilters } from '../../database/models/user/student'
import ArisError from '../arisError'
import { Transaction } from 'knex'
import db from '../../database'

type FormattedStudent = Required<StudentCtor>

export default class ArisStudent extends Student {
  private txn?: Transaction

  /**
   * Creates an new student.
   */
  static async create(student_info: StudentCtor) {
    const student = new ArisStudent(student_info)
    await student._insert()

    return student
  }

  /**
   * returns a parameter of student.
   * @param key -parameter to be returned.
   */
  get<T extends keyof FormattedStudent>(key: T): FormattedStudent[T] {
    const aux_ob = this.format()
    return aux_ob[key]
  }

  /**
   * returns a formatted object of student infos.
   */
  format() {
    const aux_ob: FormattedStudent = { user_id: this.user_id, ar: this.ar, semester: this.semester }
    return aux_ob
  }

  /**
   * Returns an Aris student.
   */
  static async get<T extends StudentFilters>(filter: T) {
    const students_info = await this._get(filter)

    return <T extends { user_id: number } | { ar: number } ? [ArisStudent] : ArisStudent[]>(
      students_info.map(student => new ArisStudent(student))
    )
  }

  /**
   * Updates the student`s info.
   */
  async update({ ar, semester }: Partial<Omit<StudentCtor, 'user_id'>>) {
    if (ar) this.ar = ar
    if (semester) this.semester = semester

    await this._update(this.txn)
  }

  /**
   * Deletes this student.
   */
  async delete() {
    await this._delete(this.txn)
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
