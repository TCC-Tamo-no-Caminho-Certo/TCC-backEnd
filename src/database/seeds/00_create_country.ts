import knex from 'knex'

const data = [{ country: 'Brasil' }]
const insert: any[] = []

export async function seed(knex: knex) {
  for (const key in data) {
    const has_country = await knex('country')
      .where(data[key])
      .then(row => (row[0] ? row[0].id_country : null))
    if (!has_country) insert.push(data[key])
  }

  await knex('country').insert(insert)
}
