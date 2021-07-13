import { Knex } from 'knex'

const data = [
  { name: 'computer engineering', icon: 'computer.svg', description: null },
  { name: 'biology', icon: 'biology.svg', description: null },
  { name: 'production engineering', icon: 'production.svg', description: null }
]
const insert: any[] = []

export async function seed(knex: Knex) {
  for (const key in data) {
    const has_data = await knex('category')
      .where(data[key])
      .then(row => (row[0] ? row[0].category_id : null))
    if (!has_data) insert.push(data[key])
  }

  await knex('category').insert(insert)
}
