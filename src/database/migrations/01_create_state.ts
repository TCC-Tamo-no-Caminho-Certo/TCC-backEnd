import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('state', table => {
    table.increments('id_state').primary()
    table.string('state', 45).notNullable()
    table.integer('country_id').unsigned().references('id_country').inTable('country').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('state')
}
