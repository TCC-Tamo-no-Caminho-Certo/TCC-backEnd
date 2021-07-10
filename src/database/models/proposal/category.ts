import ArisError from '../../../utils/arisError'
import { Knex } from 'knex'
import db from '../..'

export interface UpdateCategoryObj {
  name?: string
  icon?: string
  description?: string
}

export interface ArisCategory {
  category_id?: number
  name: string
  icon: string
  description: string
}

export default class Category {
  category_id: number
  name: string
  icon: string
  description: string

  /**
   * Creates a category.
   */
  constructor({ category_id, name, icon, description }: ArisCategory) {
    this.category_id = category_id ? category_id : 0
    this.name = name
    this.icon = icon
    this.description = description
  }

  /**
   * Inserts this category in the database.
   */
  async insert() {
    const has_category = await Category.exist(this.name)
    if (has_category) throw new ArisError('Category already exists!', 400)

    const category_id = await db('category')
      .insert({
        name: this.name,
        icon: this.icon,
        description: this.description
      })
      .then(row => row[0])

    this.category_id = category_id
  }

  /**
   * Updates this category in the database.
   */
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

    if (update) await db('category').update(update_list).where({ category_id: this.category_id })
  }

  /**
   * Delets this category in the database.
   */
  async delete() {
    await db('category').del().where({ category_id: this.category_id })
  }

  static get = {
    async ids(categories: string[], transaction?: Knex.Transaction) {
      const trx = transaction || db
      const ids = await trx('category')
        .select('category_id')
        .whereIn('name', categories)
        .then(row => row.map(value => value.category_id))

      return ids
    },

    async allCategories() {
      const categories = await db('category')
        .select()
        .then(row => (row[0] ? row : null))

      return categories
    }
  }

  /**
   * Checks if an category is already registered in the database.
   */
  static async exist(name: string) {
    const has_category = await db('category')
      .where({ name })
      .then(row => (row[0] ? row[0] : null))
    return has_category ? true : false
  }

  /**
   * returns an category if it`s registered in the database.
   */
  static async getCategory(category_id: number) {
    const category_info = await db('category')
      .where({ category_id })
      .then(row => (row[0] ? row[0] : null))
    if (!category_info) throw new ArisError('Category not found!', 400)
    return new Category(category_info)
  }
}
