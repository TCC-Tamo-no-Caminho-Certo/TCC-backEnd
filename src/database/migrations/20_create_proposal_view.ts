import knex from 'knex'

export async function up(knex: knex) {
  return knex.raw(`
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
}

export async function down(knex: knex) {
  return knex.raw(`DROP VIEW proposal_view;`)
}
