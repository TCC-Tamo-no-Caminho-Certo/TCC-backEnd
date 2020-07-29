import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('country', table => {
    table.increments('id_country').primary()
    table.string('country', 45).notNullable().unique()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('country')
}
