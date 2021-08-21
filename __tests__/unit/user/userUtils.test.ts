// import Email from '../../../src/models/user/emailModel'
// import User from '../../../src/models/user/userModel'
// import UserUtils from '../../../src/utils/user'
// import redis from '../../../src/services/redis'
// import config from '../../../src/config'
// import HTTPMocks from 'node-mocks-http'

// redis.initialize(config.redis.host, config.redis.port, config.redis.database, config.redis.password)

// describe('Test user utils', () => {
//   describe('Auth', () => {
//     const user = new User({
//       user_id: 1,
//       name: 'test',
//       surname: 'test',
//       birthday: '1897-10-11',
//       roles: ['student'],
//       emails: [new Email({ address: 'test@gmail.com', main: true })],
//       password: 'test'
//     })

//     beforeAll(async () => await redis.client.flushallAsync())

//     afterAll(async () => await redis.client.flushallAsync())

//     test('Should generate auth data on redis', async () => {
//       const token = await UserUtils.generateAccessToken(user)
//       const data = JSON.parse(await redis.client.getAsync(`auth.data.${user.user_id}`))

//       expect(token).not.toBeUndefined()
//       expect(data).not.toBeUndefined()
//     })

//     test('Should generate an access token on redis with/without "remember"', async () => {
//       const token = await UserUtils.generateAccessToken(user)
//       const token_remember = await UserUtils.generateAccessToken(user, true)

//       expect(token).not.toBeUndefined()
//       expect(token_remember).not.toBeUndefined()

//       const time = await redis.client.ttlAsync(`auth.${token}`)
//       const remember_time = await redis.client.ttlAsync(`auth.${token_remember}`)

//       expect(time < remember_time).toBe(true)
//     })

//     test('should update auth data on redis', async () => {
//       user.roles.push('professor')
//       await UserUtils.updateAccessTokenData(user)

//       const data = JSON.parse(await redis.client.getAsync(`auth.data.${user.user_id}`))

//       expect(data.roles).toEqual(expect.arrayContaining(['student', 'professor']))
//     })

//     test('should logout (delete token) the user on redis', async () => {
//       const token = await UserUtils.generateAccessToken(user)

//       const req = HTTPMocks.createRequest({
//         headers: {
//           authorization: `Bearer ${token}`
//         }
//       })

//       await UserUtils.logout(req)

//       const data = await redis.client.getAsync(`auth.${token}`)

//       expect(data).toBeNull()
//     })
//   })
// })
