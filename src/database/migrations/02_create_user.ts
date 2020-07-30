import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('user', table => {
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
    .then(() =>
      knex.schema.createTable('role', table => {
        table.increments('id_role').primary()
        table.string('title', 30).notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('role_user', table => {
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable()
        table.integer('role_id').unsigned().references('id_role').inTable('role').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('customer', table => {
        table.increments('id_customer').primary()
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('student', table => {
        table.increments('id_student').primary()
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('professor', table => {
        table.increments('id_professor').primary()
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('proponent', table => {
        table.increments('id_proponent').primary()
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable().unique()
      })
    )
    .then(() =>
      knex.raw(`
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
    )
}

export async function down(knex: knex) {
  return knex
    .raw(`DROP VIEW user_view;`)
    .then(() => knex.schema.dropTable('proponent'))
    .then(() => knex.schema.dropTable('professor'))
    .then(() => knex.schema.dropTable('student'))
    .then(() => knex.schema.dropTable('customer'))
    .then(() => knex.schema.dropTable('role_user'))
    .then(() => knex.schema.dropTable('role'))
    .then(() => knex.schema.dropTable('user'))
}
