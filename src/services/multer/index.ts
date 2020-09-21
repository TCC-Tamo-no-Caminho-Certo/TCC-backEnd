import ArisError from '../../utils/arisError'
import crypto from 'crypto'
import path from 'path'

import multer, { StorageEngine } from 'multer'
import { Request } from 'express'

export interface LimitsConfig {
  fieldSize?: number
  fieldNameSize?: number
  fields?: number
  fileSize?: number
  files?: number
}
export interface MulterConfig {
  dest: string
  storage: StorageEngine
  limits: LimitsConfig
  fileFilter(req: Request, file: any, cb: CallableFunction): void
}

const config: MulterConfig = {
  dest: path.resolve(__dirname, '../../www/uploads'),
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.resolve(__dirname, '../../../www/uploads'))
    },
    filename(req, file, cb) {
      const uniquePreffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-`
      cb(null, uniquePreffix + file.originalname)
    }
  }),
  limits: {
    fieldNameSize: undefined,
    fieldSize: undefined,
    fields: undefined,
    fileSize: 2 * 1024 * 1024,
    files: undefined
  },
  fileFilter(req, file, cb): void {
    const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new ArisError('Invalid file type!', 403))
    }
  }
}

export default multer(config)
