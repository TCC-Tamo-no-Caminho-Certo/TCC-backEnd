import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('status', table => {
    table.increments('id_status').primary()
    table.string('name', 30).notNullable().unique()
    table.string('icon', 30).notNullable().unique()
    table.text('description')
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('status')
}
