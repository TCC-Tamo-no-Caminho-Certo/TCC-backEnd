import jimp from 'jimp'

export default class Jimp {
  constructor() {}

  static async parseBuffer(buffer: Buffer, width: number = 512, height: number = 512) {
    const image = await jimp.read(buffer)
    return await image.resize(width, height).getBufferAsync(jimp.MIME_PNG)
  }
}
