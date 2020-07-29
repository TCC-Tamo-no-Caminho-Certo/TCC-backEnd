import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('proposal', table => {
    table.increments('id_proposal').primary()
    table.string('title', 30).notNullable()
    table.dateTime('created_at').notNullable()
    table.dateTime('updated_at').notNullable()
    table.float('version').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('proposal')
}
