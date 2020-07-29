import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('role_user', table => {
    table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable()
    table.integer('role_id').unsigned().references('id_role').inTable('role').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('role_user')
}
