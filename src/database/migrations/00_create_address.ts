import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('country', table => {
      table.increments('country_id').primary()
      table.string('name', 45).notNullable().unique()
    })
    .then(() =>
      knex.schema.createTable('district', table => {
        table.increments('district_id').primary()
        table.string('name', 45).notNullable()
        table.integer('country_id').unsigned().references('country_id').inTable('country').notNullable().onDelete('CASCADE')
        table.primary(['district_id', 'country_id'])
      })
    )
    .then(() =>
      knex.schema.createTable('city', table => {
        table.increments('city_id').primary()
        table.string('name', 60).notNullable()
        table.integer('district_id').unsigned().references('district_id').inTable('district').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('address', table => {
        table.increments('address_id').primary()
        table.string('address', 50).notNullable()
        table.string('postal_code', 45).notNullable()
        table.integer('city_id').unsigned().references('city_id').inTable('city').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.raw(`
        CREATE OR REPLACE VIEW address_view AS
        SELECT
            a.address_id,
            a.address,
            a.postal_code,
            ci.name AS 'city',
            d.name AS 'district',
            co.name AS 'country'
        FROM
            address a
                LEFT JOIN
            city ci ON a.city_id = ci.city_id
                LEFT JOIN
            district d ON ci.district_id = d.district_id
                LEFT JOIN
            country co ON d.country_id = co.country_id;
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
