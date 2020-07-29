import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('user', table => {
    table.increments('id_user').primary()
    table.string('name', 40).notNullable()
    table.string('sur_name', 40).notNullable()
    table.string('email', 50).notNullable().unique()
    table.date('birthday').notNullable()
    table.string('password', 100).notNullable()
    table.string('phone', 20).unique()
    table.boolean('active').notNullable()
    table.dateTime('created_at').notNullable()
    table.dateTime('updated_at').notNullable()
    table.integer('address_id').unsigned().references('id_address').inTable('address')
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('user')
}
