import knex from 'knex'

export async function seed(knex: knex) {
  await knex('role').insert([
    { title: 'admin' },
    { title: 'base user' },
    { title: 'student' },
    { title: 'professor' },
    { title: 'proponent' },
    { title: 'customer' }
  ])
}
