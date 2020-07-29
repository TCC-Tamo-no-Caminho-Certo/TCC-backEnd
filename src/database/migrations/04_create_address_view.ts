import knex from 'knex'

export async function up(knex: knex) {
  return knex.raw(`
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
}

export async function down(knex: knex) {
  return knex.raw(`DROP VIEW address_view;`)
}
