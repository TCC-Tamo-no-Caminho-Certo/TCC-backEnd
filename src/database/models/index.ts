import ArisError from '../../utils/arisError'
import { Knex } from 'knex'
import db from '..'

type Primary = Increment | Foreign
export type Foreign = 'Foreign'
export type Increment = 'Increment'

type GetPrimary<Data extends object, Type extends Primary = Primary> = { [K in keyof Data]: Data[K] extends Type ? K : never }[keyof Data]
type GetIncrement<Data extends object> = GetPrimary<Data, 'Increment'>
type GetForeign<Data extends object> = GetPrimary<Data, 'Foreign'>

type ParseKeys<Data extends object> = {
  [K in keyof Data]: Data[K] extends Primary
    ? number
    : Data[K] extends Primary | null
    ? number | null
    : Data[K] extends Primary | undefined
    ? number | undefined
    : Data[K]
}

type ParseInsert<Data extends object, PData = Omit<Data, GetIncrement<Data> | 'created_at' | 'updated_at'>> = {
  [K in keyof PData]: PData[K] extends object | null ? string : PData[K]
}
type ParseUpdate<Data extends object, PData = Partial<Omit<Data, GetPrimary<Data> | 'created_at' | 'updated_at'>>> = {
  [K in keyof PData]?: PData[K] extends object | null | undefined ? string : PData[K]
}
type ParseFilter<Data extends object, ParsedData = ParseKeys<Data>> = {
  [K in keyof ParsedData]?: K extends 'created_at' | 'updated_at'
    ? [string, string]
    : ParsedData[K] extends boolean | object | null
    ? ParsedData[K]
    : ParsedData[K] | ParsedData[K][]
}

type RecordIDs<Data extends object> = Record<GetPrimary<Data>, number>

export interface IModel<
  Data extends object,
  Update extends object = ParseUpdate<Data>,
  Insert extends object = ParseInsert<Data>,
  Filter extends object = ParseFilter<Data>
> {
  insert(data: ParseKeys<Insert>): Promise<ParseKeys<Data>>
  update(ids: RecordIDs<Data>, data: ParseKeys<Update>): Promise<void>
  delete(ids: RecordIDs<Data>): Promise<void>
  find(filter?: Filter): Knex.QueryBuilder<ParseKeys<Data>, ParseKeys<Data>[]>
  findCache(select: (keyof Data)[] | '*', filter?: Filter): ParseKeys<Data>[]

  createTrx(): Promise<void>
  commitTrx(): Promise<void>
  rollbackTrx(): Promise<void>

  cache: ParseKeys<Data>[]
  query: Knex.QueryBuilder<ParseKeys<Data>, ParseKeys<Data>[]>
  has_cache: boolean
}

export class Model<
  Data extends { [key: string]: any },
  Update extends object = ParseUpdate<Data>,
  Insert extends object = ParseInsert<Data>,
  Filter extends { [key: string]: any } = ParseFilter<Data>
> {
  protected _name: string
  protected _primary: GetPrimary<Data>[] = []
  protected _increment?: GetIncrement<Data>
  protected _foreign?: GetForeign<Data>[]

  private _cache: ParseKeys<Data>[] = []
  public has_cache: boolean

  // Transaction
  private static trx?: Knex.Transaction | null
  public static has_trx: boolean = false

  constructor(table_name: string, primary_keys: { increment?: GetIncrement<Data>; foreign?: GetForeign<Data>[] }, cache = false) {
    this._name = table_name
    if (primary_keys.increment) {
      this._increment = primary_keys.increment
      this._primary.push(<any>primary_keys.increment)
    }
    if (primary_keys.foreign) {
      this._foreign = primary_keys.foreign
      this._primary.push(...(<any>primary_keys.foreign))
    }
    if (!this._primary[0]) throw new ArisError('A primary key must be provided!', 500)

    this.has_cache = cache
    cache && this.initializeCache()
  }

  private async initializeCache() {
    const row = await db<ParseKeys<Data>>(this._name)
    if (!row) throw new ArisError('Couldn´t get data for cache', 500)
    this._cache = <ParseKeys<Data>[]>row
  }

  /**
   * Inserts this role request in the database.
   */
  async insert(data: ParseKeys<Insert>) {
    const trx = Model.trx || db

    const id = await trx<ParseKeys<Insert>, ParseKeys<Data>>(this._name)
      .insert(data as any)
      .then(row => row[0])

    if (this._increment) (<any>data)[this._increment] = <any>id
    if (this.has_cache) this._cache.push(<ParseKeys<Data>>data)

    return <ParseKeys<Data>>data
  }

  /**
   * Updates this role request in the database.
   */
  async update(primary: RecordIDs<Data>, data: ParseKeys<Update>) {
    const trx = Model.trx || db

    if (Object.values(data).length) {
      await trx<ParseKeys<Data>>(this._name)
        .update(data as any)
        .where(primary)

      if (this.has_cache)
        this._cache = this._cache.map(value => {
          const should_update = !this._primary.some(key => value[key] !== primary[key])
          return should_update ? { ...value, ...data } : value
        })
    }
  }

  /**
   * Deletes this role request in the database.
   */
  async delete(primary: RecordIDs<Data>) {
    const trx = Model.trx || db

    await trx<ParseKeys<Data>>(this._name).del().where(primary)

    if (this.has_cache) this._cache = this._cache.filter(value => !this._primary.some(key => value[key] !== primary[key]))
  }

  /**
   * Select (with a filter or not) role requests.
   */
  find(filter?: Filter) {
    const trx = Model.trx || db

    const base_query = trx<ParseKeys<Data>, ParseKeys<Data>[]>(this._name).where(builder => {
      for (const key in filter) {
        if (filter[key]) {
          if (key === 'created_at' || key === 'updated_at') builder.whereBetween(<string>key, filter[key])
          else if (Array.isArray(filter[key])) builder.whereIn(key, filter[key])
          else if (typeof filter[key] === 'object')
            for (const data_key in filter[key])
              builder.whereRaw(
                `data->'$.${data_key}' ${
                  Array.isArray((<any>filter[key])[data_key])
                    ? `in (${
                        typeof (<any>filter[key])[data_key][0] === 'string'
                          ? (<any>filter[key])[data_key].map((value: string) => `'${value}'`)
                          : (<any>filter[key])[data_key]
                      })`
                    : `= ${typeof (<any>filter[key])[data_key] === 'string' ? `'${(<any>filter[key])[data_key]}'` : (<any>filter[key])[data_key]}`
                } `
              )
          else builder.where({ [key]: filter[key] })
        }
      }
    })

    return base_query
  }

  findCache(select: (keyof Data)[] | '*', filter?: Filter) {
    // const result = this._cache.filter(data => {
    //   let should_return = 1
    //   for (const key in filter)
    //     if (filter[key]) should_return *= Array.isArray(filter[key]) ? filter[key].some((value: any) => value == data[key]) : filter[key] == data[key]

    //   return should_return
    // })
    const result = []

    for (const data of this._cache) {
      let should_return = 1

      for (const key in filter)
        if (filter[key]) should_return *= Array.isArray(filter[key]) ? filter[key].some((value: any) => value == data[key]) : filter[key] == data[key]

      if (should_return) {
        let formatted_data: any = {}
        select !== '*' ? select.forEach(key => (formatted_data[key] = data[key])) : (formatted_data = data)
        result.push(formatted_data)
      }
    }

    return result
  }

  get cache() {
    if (!this.has_cache) throw new ArisError(`${this._name} does not have a cache`, 500)
    return this._cache
  }

  get query() {
    const trx = Model.trx || db

    if (this.has_cache) throw new ArisError('Can not query a model with cache', 500)
    
    return db<ParseKeys<Data>, ParseKeys<Data>[]>(this._name)
  }

  // -----TRANSACTION----- //

  /**
   * Creates a database transaction.
   */
  async createTrx() {
    if (Model.trx) await Model.trx.rollback()
    Model.has_trx = true
    Model.trx = await db.transaction()
  }

  /**
   * Commits the transaction.
   */
  async commitTrx() {
    if (!Model.trx) throw new ArisError('Transaction wasn´t created!', 500)
    await Model.trx.commit()
    Model.has_trx = false
    Model.trx = null
  }

  /**
   * Rollback the transaction.
   */
  async rollbackTrx() {
    if (!Model.trx) throw new ArisError('Transaction wasn´t created!', 500)
    await Model.trx.rollback()
    Model.has_trx = false
    Model.trx = null
  }

  /**
   * Rollback the transaction.
   */
  static async rollbackTrx() {
    if (!Model.trx) throw new ArisError('Transaction wasn´t created!', 500)
    await Model.trx.rollback()
    Model.has_trx = false
    Model.trx = null
  }
}

/*
interface test {
  test_number: number
  test_string: string
}

function a<T extends object, K extends keyof T>(obj: T, k: K) {}
a({} as test, 'test_number') // Works normally

function b<T extends object, K extends keyof T>(k: K) {}
b<test>('') // Does not show options for k
b<test>('test_number') // Does not work

function c<T extends object, K extends keyof T>() {}
c<test, ''>() // Does not show options for K - ERROR: Type '""' does not satisfy the constraint 'keyof test'
c<test, 'test_number'>() // Works, but without intellisense

// Same for classes

// Expected to work similar to Pick type:
type d = Pick<test, 'test_string'>
*/
