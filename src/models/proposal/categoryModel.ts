import ArisError from '../arisErrorModel'
import { Transaction } from 'knex'
import db from '../../database'

export interface UpdateCategoryObj {
  name?: string
  icon?: string
  description?: string
}

export interface ArisCategory {
  id_category?: number
  name: string
  icon: string
  description: string
}
export default class Category {
  id_category: number
  name: string
  icon: string
  description: string
  /**
   * Creates a category.
   */
  constructor({ id_category, name, icon, description }: ArisCategory) {
    this.id_category = id_category ? id_category : 0
    this.name = name
    this.icon = icon
    this.description = description
  }

  async insert() {
    const has_category = await Category.exist(this.name)
    if (has_category) throw new ArisError('Category already exists!', 400)

    const id_category = await db('category')
      .insert({
        name: this.name,
        icon: this.icon,
        description: this.description
      })
      .then(row => row[0])

    this.id_category = id_category
  }

  async update({ name, icon, description }: UpdateCategoryObj) {
    let update = 0
    const update_list: UpdateCategoryObj = {}
    if (name) {
      update_list.name = name
      update++
    }
    if (icon) {
      update_list.icon = icon
      update++
    }
    if (description) {
      update_list.description = description
      update++
    }

    if (update) await db('category').update(update_list).where({ id_category: this.id_category })
  }

  async delete() {
    await db('category').del().where({ id_category: this.id_category })
  }

  static get = {
    async ids(categories: string[], transaction?: Transaction) {
      const trx = transaction || db
      const ids = await trx('category')
        .select('id_category')
        .whereIn('name', categories)
        .then(row => row.map(value => value.id_category))

      return ids
    },

    async allCategories() {
      const categories = await db('category')
        .select()
        .then(row => (row[0] ? row : null))

      return categories
    }
  }

  static async exist(name: string) {
    const has_category = await db('category')
      .where({ name })
      .then(row => (row[0] ? row[0] : null))
    return has_category ? true : false
  }

  static async getCategory(id_category: number) {
    const category_info = await db('category')
      .where({ id_category })
      .then(row => (row[0] ? row[0] : null))
    if (!category_info) throw new ArisError('Category not found!', 400)
    return new Category(category_info)
  }
}
