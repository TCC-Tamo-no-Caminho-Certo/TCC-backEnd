import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('artefact', table => {
    table.increments('id_artefact').primary()
    table.string('name', 30).notNullable()
    table.string('path', 45).notNullable()
    table.string('hash_verification', 90).notNullable()
    table.text('description')
    table.float('version').notNullable()
    table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable().unique()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('artefact')
}
