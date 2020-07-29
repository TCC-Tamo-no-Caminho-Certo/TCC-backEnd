import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('status_proposal', table => {
    table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable().unique()
    table.integer('status_id').unsigned().references('id_status').inTable('status').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('status_proposal')
}
