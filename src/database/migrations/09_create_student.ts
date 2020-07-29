import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('student', table => {
    table.increments('id_student').primary()
    table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('student')
}
