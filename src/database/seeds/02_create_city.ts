import knex from 'knex'

export async function seed(knex: knex) {
  await knex('city').insert([
    { city: 'São Paulo', state_id: 1 }
  ])
}
