import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('city', table => {
    table.increments('id_city').primary()
    table.string('city', 60).notNullable()
    table.integer('state_id').unsigned().references('id_state').inTable('state').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('city')
}
