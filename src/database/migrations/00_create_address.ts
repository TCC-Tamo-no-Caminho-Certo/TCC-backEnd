import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('country', table => {
      table.increments('id_country').primary()
      table.string('country', 45).notNullable().unique()
    })
    .then(() =>
      knex.schema.createTable('state', table => {
        table.increments('id_state').primary()
        table.string('state', 45).notNullable()
        table.integer('country_id').unsigned().references('id_country').inTable('country').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('city', table => {
        table.increments('id_city').primary()
        table.string('city', 60).notNullable()
        table.integer('state_id').unsigned().references('id_state').inTable('state').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('address', table => {
        table.increments('id_address').primary()
        table.string('address', 50).notNullable()
        table.string('zip_code', 45).notNullable()
        table.integer('city_id').unsigned().references('id_city').inTable('city').notNullable()
      })
    )
    .then(() =>
      knex.raw(`
        CREATE OR REPLACE VIEW address_view AS
        SELECT
            a.id_address,
            a.address,
            a.zip_code,
            c.city,
            s.state,
            co.country
        FROM
            address a
                LEFT JOIN
            city c ON a.city_id = c.id_city
                LEFT JOIN
            state s ON c.state_id = s.id_state
                LEFT JOIN
            country co ON s.country_id = co.id_country;
      `)
    )
}

export async function down(knex: knex) {
  return knex
    .raw(`DROP VIEW address_view;`)
    .then(() => knex.schema.dropTable('address'))
    .then(() => knex.schema.dropTable('city'))
    .then(() => knex.schema.dropTable('state'))
    .then(() => knex.schema.dropTable('country'))
}
