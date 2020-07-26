import db from 'knex'

export async function seed() {
  await db('status').insert([
    { name: 'open', icon: 'open.svg', description: null },
    { name: 'closed', icon: 'closed.svg', description: null },
    { name: 'validating', icon: 'validating.svg', description: null }
  ])
}