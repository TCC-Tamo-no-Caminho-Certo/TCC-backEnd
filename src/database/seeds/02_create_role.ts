import knex from 'knex'

const data = [
  { title: 'admin' },
  { title: 'base user' },
  { title: 'student' },
  { title: 'professor' },
  { title: 'proponent' },
  { title: 'customer' }
]
const insert: any[] = []

export async function seed(knex: knex) {
  for (const key in data) {
    const has_data = await knex('role')
      .where(data[key])
      .then(row => (row[0] ? row[0].role_id : null))
    if (!has_data) insert.push(data[key])
  }

  await knex('role').insert(insert)
}
