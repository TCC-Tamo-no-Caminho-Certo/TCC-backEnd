import knex, { Knex } from 'knex'

export async function up(knex: Knex) {
  return knex.schema
    .createTable('proposal', table => {
      table.increments('proposal_id').primary()
      table.string('title', 30).notNullable()
      table.timestamps(true, true)
      table.float('version').notNullable()
    })
    .then(() =>
      knex.schema.createTable('artefact', table => {
        table.increments('artefact_id').primary()
        table.string('name', 30).notNullable()
        table.string('path', 45).notNullable()
        table.string('hash_verification', 90).notNullable()
        table.text('description')
        table.float('version').notNullable()
        table.integer('proposal_id').unsigned().references('proposal_id').inTable('proposal').notNullable().unique().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('status', table => {
        table.increments('status_id').primary()
        table.string('name', 30).notNullable().unique()
        table.string('icon', 30).notNullable().unique()
        table.text('description')
      })
    )
    .then(() =>
      knex.schema.createTable('proposal_status', table => {
        table.integer('proposal_id').unsigned().references('proposal_id').inTable('proposal').notNullable().onDelete('CASCADE')
        table.integer('status_id').unsigned().references('status_id').inTable('status').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('category', table => {
        table.increments('category_id').primary()
        table.string('name', 30).notNullable().unique()
        table.string('icon', 30).notNullable().unique()
        table.text('description')
      })
    )
    .then(() =>
      knex.schema.createTable('proposal_category', table => {
        table.integer('proposal_id').unsigned().references('proposal_id').inTable('proposal').notNullable().onDelete('CASCADE')
        table.integer('category_id').unsigned().references('category_id').inTable('category').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.schema.createTable('user_proposal', table => {
        table.integer('user_id').unsigned().references('user_id').inTable('user').notNullable().onDelete('CASCADE')
        table.string('permission', 45).notNullable()
        table.integer('proposal_id').unsigned().references('proposal_id').inTable('proposal').notNullable().onDelete('CASCADE')
      })
    )
    .then(() =>
      knex.raw(`
      CREATE OR REPLACE VIEW proposal_view AS
        SELECT 
            p.proposal_id,
            p.created_at,
            p.updated_at,
            p.title,
            p.version,
            s.name AS 'status_name',
            s.icon AS 'status_icon',
            s.description AS 'status_description',
            c.name AS 'category_name',
            c.icon AS 'category_icon',
            c.description AS 'category_description',
            u.user_id,
            u.permission,
            a.name AS 'artefact_name',
            a.path,
            a.hash_verification,
            a.description AS 'artefect_description'
        FROM
            proposal p
                LEFT JOIN
            proposal_status sp ON p.proposal_id = sp.proposal_id
                LEFT JOIN
            status s ON s.status_id = sp.status_id
                LEFT JOIN
            proposal_category cp ON p.proposal_id = cp.proposal_id
                LEFT JOIN
            category c ON c.category_id = cp.category_id
                LEFT JOIN
            artefact a ON p.proposal_id = a.proposal_id
                LEFT JOIN
            user_proposal u ON p.proposal_id = u.proposal_id
        ORDER BY p.proposal_id;
      `)
    )
}

export async function down(knex: Knex) {
  return knex
    .raw(`DROP VIEW proposal_view;`)
    .then(() => knex.schema.dropTable('user_proposal'))
    .then(() => knex.schema.dropTable('category_proposal'))
    .then(() => knex.schema.dropTable('category'))
    .then(() => knex.schema.dropTable('status_proposal'))
    .then(() => knex.schema.dropTable('status'))
    .then(() => knex.schema.dropTable('artefact'))
    .then(() => knex.schema.dropTable('proposal'))
}
