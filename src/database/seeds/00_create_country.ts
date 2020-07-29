import knex from 'knex'

export async function seed(knex: knex) {
  await knex('state').insert([
    { country: 'Brasil' }
  ])
}
