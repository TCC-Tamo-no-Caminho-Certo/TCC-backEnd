import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('country', table => {
      table.increments('id_country').primary()
      table.string('name', 45).notNullable().unique()
    })
    .then(() =>
      knex.schema.createTable('district', table => {
        table.increments('id_district').primary()
        table.string('name', 45).notNullable()
        table.integer('country_id').unsigned().references('id_country').inTable('country').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('city', table => {
        table.increments('id_city').primary()
        table.string('name', 60).notNullable()
        table.integer('district_id').unsigned().references('id_district').inTable('district').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('address', table => {
        table.increments('id_address').primary()
        table.string('address', 50).notNullable()
        table.string('postal_code', 45).notNullable()
        table.integer('city_id').unsigned().references('id_city').inTable('city').notNullable()
      })
    )
    .then(() =>
      knex.raw(`
        CREATE OR REPLACE VIEW address_view AS
        SELECT
            a.id_address,
            a.address,
            a.postal_code,
            ci.name AS 'city',
            d.name AS 'district',
            co.name AS 'country'
        FROM
            address a
                LEFT JOIN
            city ci ON a.city_id = ci.id_city
                LEFT JOIN
            district d ON ci.district_id = d.id_district
                LEFT JOIN
            country co ON d.country_id = co.id_country;
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
