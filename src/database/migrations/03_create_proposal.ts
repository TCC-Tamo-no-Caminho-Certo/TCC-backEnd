import knex from 'knex'

export async function up(knex: knex) {
  return knex.schema
    .createTable('proposal', table => {
      table.increments('id_proposal').primary()
      table.string('title', 30).notNullable()
      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()
      table.float('version').notNullable()
    })
    .then(() =>
      knex.schema.createTable('artefact', table => {
        table.increments('id_artefact').primary()
        table.string('name', 30).notNullable()
        table.string('path', 45).notNullable()
        table.string('hash_verification', 90).notNullable()
        table.text('description')
        table.float('version').notNullable()
        table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable().unique()
      })
    )
    .then(() =>
      knex.schema.createTable('status', table => {
        table.increments('id_status').primary()
        table.string('name', 30).notNullable().unique()
        table.string('icon', 30).notNullable().unique()
        table.text('description')
      })
    )
    .then(() =>
      knex.schema.createTable('status_proposal', table => {
        table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable().unique()
        table.integer('status_id').unsigned().references('id_status').inTable('status').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('category', table => {
        table.increments('id_category').primary()
        table.string('name', 30).notNullable().unique()
        table.string('icon', 30).notNullable().unique()
        table.text('description')
      })
    )
    .then(() =>
      knex.schema.createTable('category_proposal', table => {
        table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable()
        table.integer('category_id').unsigned().references('id_category').inTable('category').notNullable()
      })
    )
    .then(() =>
      knex.schema.createTable('user_proposal', table => {
        table.integer('user_id').unsigned().references('id_user').inTable('user').notNullable()
        table.string('permission', 45).notNullable()
        table.integer('proposal_id').unsigned().references('id_proposal').inTable('proposal').notNullable()
      })
    )
    .then(() =>
      knex.raw(`
      CREATE OR REPLACE VIEW proposal_view AS
        SELECT 
            p.id_proposal,
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
            status_proposal sp ON p.id_proposal = sp.proposal_id
                LEFT JOIN
            status s ON s.id_status = sp.status_id
                LEFT JOIN
            category_proposal cp ON p.id_proposal = cp.proposal_id
                LEFT JOIN
            category c ON c.id_category = cp.category_id
                LEFT JOIN
            artefact a ON p.id_proposal = a.proposal_id
                LEFT JOIN
            user_proposal u ON p.id_proposal = u.proposal_id
        ORDER BY p.id_proposal;
      `)
    )
}

export async function down(knex: knex) {
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
