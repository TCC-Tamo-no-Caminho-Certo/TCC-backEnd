import { RoleTypes } from '../../src/models/user/roleModel'
import permission from '../../src/middlewares/permission'
import auth from '../../src/middlewares/auth'
import redis from '../../src/services/redis'
import HTTPMocks from 'node-mocks-http'
import config from '../../src/config'
import { v4 as uuidv4 } from 'uuid'

redis.initialize(config.redis.host, config.redis.port, config.redis.database, config.redis.password)
// update permission tests
describe('Test middlewares', () => {
  describe('Auth', () => {
    afterAll(async () => await redis.client.flushallAsync())

    beforeAll(async () => await redis.client.flushallAsync())

    test('should allow access', async () => {
      const token = uuidv4()
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: `Bearer 1-${token}`
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()
      await redis.client.setAsync(
        `auth.data.${1}`,
        JSON.stringify({
          id: 1,
          roles: ['student']
        })
      )
      await redis.client.setAsync(`auth.1-${token}`, '1')
      await auth(req, res, next)

      expect(next).toBeCalled()
    })

    test('shouldn`t allow access if a token is not provided', async () => {
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: undefined
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      await auth(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getData().message).toBe('No token provided!')
    })

    test('shouldn`t allow access if a token don`t have an identifier', async () => {
      const token = uuidv4()
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: token
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      await auth(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getData().message).toBe('Token error!')
    })

    test('shouldn`t allow access if the token identifier is wrong', async () => {
      const token = uuidv4()
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: `Wrong ${token}`
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      await auth(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getData().message).toBe('Token malformated!')
    })

    test('shouldn`t allow access if the token isn`t in redis`s memory', async () => {
      const token = uuidv4()
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      await auth(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getData().message).toBe('Invalid token!')
    })
  })

  describe('Permission', () => {
    test('should allow access for all roles in the list', () => {
      const roles: RoleTypes[] = ['admin', 'guest', 'aris', 'customer', 'professor', 'evaluator', 'moderator', 'student']
      const req = HTTPMocks.createRequest({
        body: {
          _roles: ['admin']
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      roles.forEach(role => {
        req.body._roles = [role]
        permission(roles)(req, res, next)
      })

      expect(next).toBeCalledTimes(roles.length)
    })

    test('shouldn`t allow access for wrong roles', () => {
      const req = HTTPMocks.createRequest({
        body: {
          _roles: ['base user']
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()

      permission(['admin', 'professor'])(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getData().success).toBe(false)
    })
  })
})
