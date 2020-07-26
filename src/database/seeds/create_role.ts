import db from 'knex'

export async function seed() {
  await db('role').insert([
    { title: 'admin' },
    { title: 'student' },
    { title: 'professor' },
    { title: 'proponent' },
    { title: 'customer' }
  ])
}