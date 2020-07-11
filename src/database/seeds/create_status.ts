import db from 'knex'

export async function seed() {
  await db('status').insert([
    { name: 'Open', icon: 'open.svg', description: null },
    { name: 'Closed', icon: 'closed.svg', description: null },
    { name: 'Validating', icon: 'validating.svg', description: null },
  ])
}