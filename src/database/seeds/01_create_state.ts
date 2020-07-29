import knex from 'knex'

export async function seed(knex: knex) {
  await knex('state').insert([
    { state: 'São Paulo', country_id: 1 }
  ])
}
