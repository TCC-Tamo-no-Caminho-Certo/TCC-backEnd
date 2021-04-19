import minio from '../services/minio'
import { v4 as uuidv4 } from 'uuid'

export default class Minio {
  readonly file: string
  private data: string
  private type: string
  buffer: Buffer

  constructor(file: string) {
    const info = file.split(',', 2)

    this.file = file
    this.type = info[0]
    this.data = info[1]
    this.buffer = Buffer.from(this.data, 'base64')
  }

  validateTypes(types: string[]) {
    return types.some(type => this.data && this.type === type)
  }

  async insert(bucket: string) {
    const objectUuid = uuidv4()

    await minio.client.putObject(bucket, objectUuid, this.buffer, this.buffer.length, { 'Content-Type': this.type })

    return objectUuid
  }

  async update(bucket: string, oldUuid: string) {
    const objectUuid = await this.insert(bucket)
    await Minio.delete(bucket, oldUuid)
    return objectUuid
  }

  static async delete(bucket: string, oldUuid: string) {
    oldUuid !== 'default' && (await minio.client.removeObject(bucket, oldUuid))
  }

  static async get(bucket: string, uuid: string) {
    const url = await minio.client.presignedUrl('GET', bucket, uuid, 24*60*60)
    const parsed_url = `https://s3.steamslab.com/${bucket}` + url.split(`/${bucket}`)[1]
    return parsed_url
  }
}
