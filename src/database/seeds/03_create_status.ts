import { Knex } from 'knex'

const data = [
  { name: 'draft', icon: 'draft.svg', description: null },
  { name: 'evaluated', icon: 'evaluated.svg', description: null },
  { name: 'under review', icon: 'under_review.svg', description: null },
  { name: 'waiting evaluation', icon: 'waiting evaluation.svg', description: null }
]
const insert: any[] = []

export async function seed(knex: Knex) {
  // for (const key in data) {
  //   const has_data = await knex('status')
  //     .where(data[key])
  //     .then(row => (row[0] ? row[0].status_id : null))
  //   if (!has_data) insert.push(data[key])
  // }

  // await knex('status').insert(insert)
}
