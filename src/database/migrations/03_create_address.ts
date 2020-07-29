import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema.createTable('address', table => {
    table.increments('id_address').primary()
    table.string('address', 50).notNullable()
    table.string('zip_code', 45).notNullable()
    table.integer('city_id').unsigned().references('id_city').inTable('city').notNullable()
  })
}

export async function down(knex: knex) {
  return knex.schema.dropTable('address')
}
