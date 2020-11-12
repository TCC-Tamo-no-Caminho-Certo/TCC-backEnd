import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('user', table => {
      table.increments('user_id').primary()
      table.boolean('active').notNullable()
      table.string('name', 40).notNullable()
      table.string('surname', 40).notNullable()
      table.string('email', 50).notNullable().unique()
      table.string('avatar', 100).notNullable().defaultTo('default')
      table.string('password', 100).notNullable()
      table.string('phone', 20).unique()
      table.date('birthday').notNullable()
      table.timestamps(true, true)
      table.integer('address_id').unsigned().references('address_id').inTable('address')
    })
    .then(() =>
      knex.schema.createTable('role', table => {
        table.increments('role_id').primary()
        table.string('title', 30).notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('user_role', table => {
        table.integer('user_id').unsigned().references('user_id').inTable('user').notNullable().onDelete('CASCADE')
        table.integer('role_id').unsigned().references('role_id').inTable('role').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('customer', table => {
        table.integer('customer_id').unsigned().references('user_id').inTable('user').primary().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('student', table => {
        table.integer('student_id').unsigned().references('user_id').inTable('user').primary().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('professor', table => {
        table.integer('professor_id').unsigned().references('user_id').inTable('user').primary().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('moderator', table => {
        table.integer('moderator_id').unsigned().references('user_id').inTable('user').primary().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.raw(`
      CREATE OR REPLACE VIEW user_view AS
        SELECT 
            u.user_id,
            u.active,
            u.name,
            u.surname,
            u.email,
            u.avatar,
            u.password,
            u.phone,
            u.birthday,
            u.created_at,
            u.updated_at,
            r.title AS 'role',
            a.*,
            s.*,
            p.*,
            m.*,
            c.*
        FROM
            user u
                LEFT JOIN
            address_view a ON u.address_id = a.address_id
                LEFT JOIN
            user_role ru ON u.user_id = ru.user_id
                LEFT JOIN
            role r ON ru.role_id = r.role_id
                LEFT JOIN
            student s ON u.user_id = s.student_id
                LEFT JOIN
            professor p ON u.user_id = p.professor_id
                LEFT JOIN
            moderator m ON u.user_id = m.moderator_id
                LEFT JOIN
            customer c ON u.user_id = c.customer_id;
      `)
    )
}

export async function down(knex: knex) {
  return knex
    .raw(`DROP VIEW user_view;`)
    .then(() => knex.schema.dropTable('moderator'))
    .then(() => knex.schema.dropTable('professor'))
    .then(() => knex.schema.dropTable('student'))
    .then(() => knex.schema.dropTable('customer'))
    .then(() => knex.schema.dropTable('role_user'))
    .then(() => knex.schema.dropTable('role'))
    .then(() => knex.schema.dropTable('user'))
}
