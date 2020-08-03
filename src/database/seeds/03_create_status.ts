import knex from 'knex'

const data = [
  { name: 'open', icon: 'open.svg', description: null },
  { name: 'closed', icon: 'closed.svg', description: null },
  { name: 'validating', icon: 'validating.svg', description: null }
]
const insert: any[] = []

export async function seed(knex: knex) {
  for (const key in data) {
    const has_data = await knex('status')
      .where(data[key])
      .then(row => (row[0] ? row[0].status_id : null))
    if (!has_data) insert.push(data[key])
  }

  await knex('status').insert(insert)
}
