import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('user_proposal', table => {
    table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable()
    table.string('permission', 45).notNullable()
    table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('user_proposal')
}
