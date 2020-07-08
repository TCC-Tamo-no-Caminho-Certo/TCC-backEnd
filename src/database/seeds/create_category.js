import db from 'knex'

export async function seed() {
  await db('category').insert([
    { name: 'computer engineering', icon: 'computer.svg', description: null },
    { name: 'biology', icon: 'biology.svg', description: null },
    { name: 'production engineering', icon: 'production.svg', description: null },
  ])
}