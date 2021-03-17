import * as Minio from 'minio'
import Logger from '../logger'

class MinioManager {
  publicBuckets: string[] = ['profile']
  privateBuckets: string[] = ['documents']
  public client: Minio.Client = <Minio.Client>{}
  public enabled: boolean = false

  initialize(host: string, port: number, useSsl: boolean, accessKey: string, secretKey: string) {
    this.client = new Minio.Client({
      endPoint: host,
      port: port,
      useSSL: useSsl,
      accessKey: accessKey,
      secretKey: secretKey
    })
    this.publicBuckets.map(bucketName => {
      this.client.bucketExists(bucketName, (err: any, exists: boolean) => {
        if (err) return Logger.error(err)
        if (!exists)
          this.client.makeBucket(bucketName, 'local', err => {
            if (err) return Logger.error(err)

            this.client.setBucketPolicy(
              bucketName,
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: ['s3:GetObject'],
                    Principal: {
                      AWS: ['*']
                    },
                    Effect: 'Allow',
                    Resource: [`arn:aws:s3:::${bucketName}/*`],
                    Sid: ''
                  }
                ]
              })
            )
          })
      })
    })
    this.privateBuckets.map(bucketName => {
      this.client.bucketExists(bucketName, (err: any, exists: boolean) => {
        if (err) return Logger.error(err)
        if (!exists)
          this.client.makeBucket(bucketName, 'local', err => {
            if (err) return Logger.error(err)

            this.client.setBucketPolicy(
              bucketName,
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: ['s3:GetObject'],
                    Principal: {
                      AWS: ['*']
                    },
                    Effect: 'Deny',
                    Resource: [`arn:aws:s3:::${bucketName}/*`],
                    Sid: ''
                  }
                ]
              })
            )
          })
      })
    })
    //this.client.putObject
    this.enabled = true
  }

  newStatement(bucketName: string, action: string[], effect: string) {
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: action,
          Principal: {
            AWS: ['*']
          },
          Effect: effect,
          Resource: [`arn:aws:s3:::${bucketName}/*`],
          Sid: ''
        }
      ]
    })
  }
}

const minioManager = new MinioManager()
export default minioManager
