import minio from '../services/minio'
import { v4 as uuidv4 } from 'uuid'
import Jimp from 'jimp'

export default class Minio {
  file: string
  stringData: string[]
  buffer?: Buffer

  constructor(file: string) {
    this.file = file
    this.stringData = file.split(',', 2)
  }

  validateType(type: string) {
    return this.stringData.length == 2 && this.stringData[0] === type
  }

  async createBuffer() {
    // meke resize optional
    const dataBuffer = Buffer.from(this.stringData[1], 'base64')
    const image = await Jimp.read(dataBuffer)
    this.buffer = await image.resize(512, 512).getBufferAsync(Jimp.MIME_PNG)
  }

  async insert(bucket: string, content_type: string) {
    const objectUuid = uuidv4()

    await this.createBuffer()
    await minio.client.putObject(bucket, objectUuid, this.buffer!, this.buffer!.length, { 'Content-Type': content_type })

    return objectUuid
  }

  async delete(bucket: string, oldUuid: string) {
    oldUuid !== 'default' && (await minio.client.removeObject(bucket, oldUuid))
  }

  async update(bucket: string, content_type: string, oldUuid: string) {
    const objectUuid = await this.insert(bucket, content_type)
    await this.delete(bucket, oldUuid)
    return objectUuid
  }
}