import knex from 'knex'

export async function seed(knex: knex) {
  await knex('status').insert([
    { name: 'open', icon: 'open.svg', description: null },
    { name: 'closed', icon: 'closed.svg', description: null },
    { name: 'validating', icon: 'validating.svg', description: null }
  ])
}
