import ArisError from '../../../utils/arisError'
import { RoleTypes } from '../../../types'
import db from '../..'

const roles: Required<RoleCtor>[] = []

db<Required<RoleCtor>>('role').then(row => {
  if (!row[0]) throw new ArisError('Couldn´t get all roles', 500)
  roles.push(...row)
})

export interface RoleCtor<T extends RoleTypes = RoleTypes> {
  role_id?: number
  title: T
}

export default class Role<T extends RoleTypes = RoleTypes> {
  protected role_id: number
  protected title: T

  /**
   * Creates a role.
   */
  protected constructor({ role_id, title }: RoleCtor<T>) {
    this.role_id = role_id || 0 //Gives a temporary id when creating a new role
    this.title = title
  }

  protected static _find<T extends RoleTypes | number>(identifier: T) {
    const role = roles.find(role => (typeof identifier === 'string' ? role.title === identifier : role.role_id === identifier))
    if (!role) throw new ArisError(`Role provided does't exists!`, 400)
    return <T extends RoleTypes ? Required<RoleCtor<T>> : Required<RoleCtor>>role
  }

  protected static _findAll() {
    return roles
  }
}
