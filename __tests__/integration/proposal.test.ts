// import db from '../../src/database'
// import request from 'supertest'
// import app from '../../src/server'
// import jwt from 'jsonwebtoken'

// const professorToken = jwt.sign(
//   {
//     id: 0,
//     role: 'professor'
//   },
//   <string>process.env.JWT_PRIVATE_KEY,
//   { algorithm: 'RS256', expiresIn: '1d' }
// )

// const studentToken = jwt.sign(
//   {
//     id: 0,
//     role: 'student'
//   },
//   <string>process.env.JWT_PRIVATE_KEY,
//   { algorithm: 'RS256', expiresIn: '1d' }
// )

// describe('Session', () => {
//   test('Shouldn´t allow access without providing a token', async () => {
//     const response = await request(app).get('/session/proposal/1')

//     expect(response.status).toBe(401)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Message).toBe('No token provided!')
//   })

//   test('Shouldn´t allow access providing a invalid token', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .set('Authorization', 'Bearer ' + 'invalid')

//     expect(response.status).toBe(401)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Message).toBe('Invalid token!')
//   })

//   test('Shouldn´t allow access providing a token without Bearer', async () => {
//     const response = await request(app).get('/session/proposal/1').set('Authorization', studentToken)

//     expect(response.status).toBe(401)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Message).toBe('Token error!')
//   })

//   test('Shouldn´t allow access providing a token malformated', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .set('Authorization', 'wrong ' + studentToken)

//     expect(response.status).toBe(401)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Message).toBe('Token malformated!')
//   })

//   test('Shouldn´t allow access for users that isn´t professors', async () => {
//     const response = await request(app)
//       .delete('/session/proposal/1')
//       .set('Authorization', 'Bearer ' + studentToken)

//     expect(response.status).toBe(403)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Message).toBe('User is not a professor!')
//   })

//   test('Should allow access for professor', async () => {
//     const response = await request(app)
//       .delete('/session/proposal/1')
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.body.Message).not.toBe('User is not a professor!')
//   })
// })

// describe('Proposal', () => {
//   let proposal_id: number
//   let token: string

//   beforeAll(async () => {
//     const response = await request(app).post('/register').send({
//       city: 'São Paulo',
//       address: 'test',
//       zip_code: 'test',
//       name: 'Test',
//       sur_name: 'test',
//       phone: 'test',
//       email: 'test@hotmail.com',
//       password: 'test',
//       role: 'professor'
//     })

//     token = response.body.access_token
//   })

//   afterAll(async () => {
//     const id = await db('user')
//       .select('id_user')
//       .where({ email: 'test@hotmail.com' })
//       .then(row => row[0].id_user)
//     await db('role_user').del().where({ user_id: id })
//     await db('user').del().where({ id_user: id })
//     await db('address').del().where({ address: 'test', zip_code: 'test' })
//   })

//   // CREATE
//   test('shouldn´t create a proposal with invalid status', async () => {
//     const response = await request(app)
//       .post('/session/proposal')
//       .send({
//         title: 'test_test',
//         version: 3,
//         status: 'wrong',
//         categories: ['computer engineering']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body).toHaveProperty('Error')
//   })

//   test('shouldn´t create a proposal with invalid category', async () => {
//     const response = await request(app)
//       .post('/session/proposal')
//       .send({
//         title: 'test_test',
//         version: 3,
//         status: 'open',
//         categories: ['wrong']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body).toHaveProperty('Error')
//   })

//   test('should create a proposal with valid credentials', async () => {
//     const response = await request(app)
//       .post('/session/proposal')
//       .send({
//         title: 'test_test',
//         version: 3,
//         status: 'open',
//         categories: ['computer engineering', 'production engineering']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     proposal_id = await db('proposal')
//       .select('id_proposal')
//       .where({ title: 'test_test', version: 3 })
//       .then(row => row[0].id_proposal)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//   })

//   // GET
//   test('should return a JSON of the proposals without any filter', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body).toHaveProperty('list')
//   })

//   test('should return a JSON of the proposals with some filter', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .send({
//         ids: [`${proposal_id}`],
//         users: null,
//         titles: ['test_test'],
//         created_at: null,
//         updated_at: null,
//         status_name: ['open'],
//         categories_name: ['computer engineering', 'production engineering']
//       })
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body.list).not.toBe('Didn´t find any proposal')
//   })

//   test('should return a JSON of the proposals with all filter', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .send({
//         ids: [4, 5],
//         users: [1],
//         titles: ['updated', 'something'],
//         created_at: ['2020-05-09', '2020-05-09'],
//         updated_at: ['2020-05-09', '2020-05-10'],
//         status_name: ['open', 'validating'],
//         categories_name: ['computer engineering', 'biology']
//       })
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//   })

//   test('should return didn´t find any proposal', async () => {
//     const response = await request(app)
//       .get('/session/proposal/1')
//       .send({
//         users: [-1]
//       })
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body.list).toBe('Didn´t find any proposal')
//   })

//   // UPDATE
//   test('shouldn´t update a proposal if not the owner', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: 'test_test',
//         version: 1.5,
//         status: 'open',
//         categories: ['computer engineering']
//       })
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Error).toBe('Not the owner of the proposal!')
//   })

//   test('shouldn´t update a proposal with wrong proposal id', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${0}`)
//       .send({
//         title: 'test_test',
//         version: 1.5,
//         status: 'open',
//         categories: ['computer engineering']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Error).toBe('Proposal not found!')
//   })

//   test('shouldn´t update with wrong status', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: 'test_test',
//         version: null,
//         status: 'wrong',
//         categories: ['computer engineering', 'biology']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Error).toBe('Status does`t exists!')
//   })

//   test('shouldn´t update with wrong category', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: 'test_test',
//         version: null,
//         status: 'open',
//         categories: ['computer engineering', 'wrong']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body.Error).toBe(`A category provided does't exists!`)
//   })

//   test('should update a proposal providing all credentials', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: 'test_test',
//         version: 1,
//         status: 'closed',
//         categories: ['computer engineering', 'biology']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body.categories.length).toBe(2)
//   })

//   test('should update a proposal providing some credentials', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: null,
//         version: 1.5,
//         status: 'closed',
//         categories: ['computer engineering', 'biology']
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body.version).toBe(1.5)
//   })

//   test('should update without change a proposal providing no credentials', async () => {
//     const response = await request(app)
//       .patch('/session/proposal/' + `${proposal_id}`)
//       .send({
//         title: null,
//         version: null,
//         status: null,
//         categories: null
//       })
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//     expect(response.body.title).toBe('Not updated')
//     expect(response.body.status).toBe('Not updated')
//     expect(response.body.version).toBe('Not updated')
//     expect(response.body.categories).toBe('Not updated')
//   })

//   // DELETE
//   test('shouldn´t delete a proposal if not the owner', async () => {
//     const response = await request(app)
//       .delete('/session/proposal/' + `${proposal_id}`)
//       .set('Authorization', 'Bearer ' + professorToken)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body).toHaveProperty('Error')
//   })

//   test('shouldn´t delete a proposal with wrong id', async () => {
//     const response = await request(app)
//       .delete('/session/proposal/' + `${0}`)
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(400)
//     expect(response.body.Success).toBe(false)
//     expect(response.body).toHaveProperty('Error')
//   })

//   test('should delete a proposal', async () => {
//     const response = await request(app)
//       .delete('/session/proposal/' + `${proposal_id}`)
//       .set('Authorization', 'Bearer ' + token)

//     expect(response.status).toBe(200)
//     expect(response.body.Success).toBe(true)
//   })
// })
