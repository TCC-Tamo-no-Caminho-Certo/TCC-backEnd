import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('role', table => {
    table.increments('id_role').primary()
    table.string('title', 30).notNullable().unique()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('role')
}
