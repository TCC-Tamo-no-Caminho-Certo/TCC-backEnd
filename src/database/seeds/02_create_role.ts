import { Knex } from 'knex'

const data = [
  { title: 'admin' },
  { title: 'guest' },
  { title: 'student' },
  { title: 'professor' },
  { title: 'moderator' },
  { title: 'customer' }
]
const insert: any[] = []

export async function seed(knex: Knex) {
  for (const key in data) {
    const has_data = await knex('role')
      .where(data[key])
      .then(row => (row[0] ? row[0].role_id : null))
    if (!has_data) insert.push(data[key])
  }

  await knex('role').insert(insert)
}
