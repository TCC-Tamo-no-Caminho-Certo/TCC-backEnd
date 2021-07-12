import config from '../config'
import knex, { Knex } from 'knex'

declare module 'knex' {
  namespace Knex {
    interface QueryBuilder {
      paginate<TRecord, TResult>(page?: number, per_page?: number): Knex.QueryBuilder<TRecord, TResult>
    }
  }
}

knex.QueryBuilder.extend('paginate', function (page, per_page) {
  page ||= 1
  per_page ||= 50

  return this.offset((page - 1) * per_page).limit(per_page)
})

const connection = knex(config.database)

export default connection as Knex
