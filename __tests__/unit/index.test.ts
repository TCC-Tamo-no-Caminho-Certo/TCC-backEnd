import { v4 as uuidv4 } from 'uuid'
import config from '../../src/config'
import HTTPMocks from 'node-mocks-http'
import redis from '../../src/services/redis'
import auth from '../../src/middlewares/auth'
import captcha from '../../src/middlewares/recaptcha'
import permission from '../../src/middlewares/permission'

redis.initialize(config.redis.host, config.redis.port, config.redis.database, config.redis.password)

describe('test middlewares', () => {
  describe('auth', () => {
    test('should allow access', async () => {
      const token = uuidv4()
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()
      await redis.client.setAsync(`auth.${token}`, JSON.stringify({ id: 1, role: 'student' }))
  
      await auth(req, res, next)
      expect(next).toBeCalled()
    })

    test('shouldn`t allow access if a token is not provided' , async () => {
      const req = HTTPMocks.createRequest({
        headers: {
          authorization: undefined
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()
  
      await auth(req, res, next)
      expect(res.statusCode).toBe(403)
      expect(res._getJSONData().message).toBe('No token provided!')
    })

    test('shouldn`t allow access if a token don`t have an identifier' , async () => {
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
      expect(res._getJSONData().message).toBe('Token error!')
    })

    test('shouldn`t allow access if the token identifier is wrong' , async () => {
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
      expect(res._getJSONData().message).toBe('Token malformated!')
    })
    
    test('shouldn`t allow access if the token isn`t in memory' , async () => {
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
      expect(res._getJSONData().message).toBe('Invalid token!')
    })
  })

  describe('permission', () => {
    test('should allow access for all roles in de list', () => {
      const req = HTTPMocks.createRequest({
        body: {
          _role: 'admin'
        }
      })
      const res = HTTPMocks.createResponse()
      const next = jest.fn()
  
      permission(['admin', 'professor', 'proponent', 'student'])(req, res, next)

      req.body._role = 'professor'
      permission(['admin', 'professor', 'proponent', 'student'])(req, res, next)

      req.body._role = 'proponent'
      permission(['admin', 'professor', 'proponent', 'student'])(req, res, next)

      req.body._role = 'student'
      permission(['admin', 'professor', 'proponent', 'student'])(req, res, next)

      expect(next).toBeCalledTimes(4)
    })

    test('shouldn`t allow access for wrong roles', () => {
      const req = HTTPMocks.createRequest({
        body: {
          _role: 'base user'
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
