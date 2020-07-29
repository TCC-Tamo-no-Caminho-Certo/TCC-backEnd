import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('category_proposal', table => {
    table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable()
    table.integer('category_id').unsigned().references('id_category').inTable('category').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('category_proposal')
}
