import ValSchema, { P } from '../utils/validation'
import ArisError from '../utils/arisError'
import { emitter } from '../subscribers'
import RedisConnection from '../services/redis'
import { v4 as uuidv4 } from 'uuid'

import { RoleTypes } from '../@types/types'

export class AuthService {
  private Redis: typeof RedisConnection

  constructor(Redis: typeof RedisConnection) {
    this.Redis = Redis
  }

  private async generateAccessToken(user_id: number, roles: RoleTypes[], remember?: boolean) {
    const token = uuidv4()

    const reply = await this.Redis.client.getAsync(`auth:data:${user_id}`)
    const data = JSON.parse(reply)

    if (!data) {
      await this.Redis.client.setAsync(
        `auth:data:${user_id}`,
        JSON.stringify({
          id: user_id,
          roles
        })
      )
    }
    await this.Redis.client.setexAsync(`auth:${user_id}-${token}`, remember ? 2592000 : 86400, user_id.toString())

    return `${user_id}-${token}`
  }

  private async updateAccessTokenData(user_id: number, roles: RoleTypes[]) {
    await this.Redis.client.delAsync(`auth:data:${user_id}`)
    await this.Redis.client.setAsync(
      `auth:data:${user_id}`,
      JSON.stringify({
        user_id,
        roles
      })
    )
  }

  /**
   * Delets an access token of the user.
   */
  async deleteAccessToken(auth: string) {
    const parts = auth.split(' ')
    const [, token] = parts

    await this.Redis.client.delAsync(`auth:${token}`)
  }

  /**
   * Delets all access token of the user.
   */
  async deleteAllAccessToken(auth: string) {
    const parts = auth.split(' ')
    const [, token] = parts
    const [user_id] = token.split('-', 1)

    const keys = await this.Redis.client.keysAsync(`auth:${user_id}*`)
    await this.Redis.client.delAsync(keys)
  }

  /**
   * Delets an auth data of the user.
   */
  async deleteAuthData(auth: string) {
    const parts = auth.split(' ')
    const [, token] = parts
    const [user_id] = token.split('-', 1)

    await this.Redis.client.delAsync(`auth:data:${user_id}`)
  }
}

export default new AuthService(RedisConnection)