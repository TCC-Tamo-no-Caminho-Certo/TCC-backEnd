import knex from 'knex'

export async function up(knex: knex) {
  return knex.raw(`
  CREATE OR REPLACE VIEW user_view AS
    SELECT 
        u.id_user,
        u.name,
        u.sur_name,
        u.email,
        u.birthday,
        u.password,
        u.phone,
        u.active,
        u.created_at,
        u.updated_at,
        r.title AS 'role',
        a.id_address AS 'address_id',
        a.address,
        a.zip_code,
        a.city,
        a.state,
        a.country
    FROM
        user u
            LEFT JOIN
        address_view a ON u.address_id = a.id_address
            LEFT JOIN
        role_user ru ON u.id_user = ru.user_id
            LEFT JOIN
        role r ON ru.role_id = r.id_role
            LEFT JOIN
        student ON u.id_user = student.user_id
            LEFT JOIN
        professor ON u.id_user = professor.user_id
            LEFT JOIN
        proponent ON u.id_user = proponent.user_id
            LEFT JOIN
        customer ON u.id_user = customer.user_id;
  `)
}

export async function down(knex: knex) {
  return knex.raw(`DROP VIEW user_view;`)
}
