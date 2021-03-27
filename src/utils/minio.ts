import minio from '../services/minio'
import { v4 as uuidv4 } from 'uuid'

export default class Minio {
  readonly file: string
  private stringData: string[]
  buffer: Buffer

  constructor(file: string) {
    this.file = file
    this.stringData = file.split(',', 2)
    this.buffer = Buffer.from(this.stringData[1], 'base64')
  }

  validateTypes(types: string[]) {
    return types.some(type => this.stringData.length === 2 && this.stringData[0] === type)
  }

  async insert(bucket: string, content_type: string) {
    const objectUuid = uuidv4()

    await minio.client.putObject(bucket, objectUuid, this.buffer, this.buffer.length, { 'Content-Type': content_type })

    return objectUuid
  }

  async update(bucket: string, content_type: string, oldUuid: string) {
    const objectUuid = await this.insert(bucket, content_type)
    await Minio.delete(bucket, oldUuid)
    return objectUuid
  }

  static async delete(bucket: string, oldUuid: string) {
    oldUuid !== 'default' && (await minio.client.removeObject(bucket, oldUuid))
  }

  static async get(bucket: string, uuid: string) {
    const url = await minio.client.presignedUrl('GET', bucket, uuid, 24*60*60)
    return url
  }
}
