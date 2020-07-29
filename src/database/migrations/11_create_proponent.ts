import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('proponent', table => {
    table.increments('id_proponent').primary()
    table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('proponent')
}
