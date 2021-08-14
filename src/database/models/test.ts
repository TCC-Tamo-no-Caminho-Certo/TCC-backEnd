import { Knex } from 'knex'
import db from '..'

type ModelKeys<T extends object> = {
  primary: (keyof T)[]
  foreign?: (keyof T)[]
  increment?: keyof T
  default?: { [Key in keyof T]?: T[Key] }
  virtual?: (keyof T)[]
  unique?: (keyof T)[]
}

export class Model<
  Data extends object,
  NF extends keyof Data,
  I extends ModelKeys<Data> = ModelKeys<Data>,
  Insert = Omit<Data, NonNullable<I['increment']> | keyof I['default'] | NonNullable<I['virtual']>[0]>,
  Update = Partial<Omit<Data, I['primary'][0] | NonNullable<I['virtual']>[0]>>,
  Filter = Omit<{ [Key in keyof Data]: Data[Key] | Data[Key][] }, NF>,
  Primary = Record<I['primary'][0], number>
> {
  protected _name: string
  protected _primary: I['primary']
  protected _increment?: I['increment']
  protected _foreign?: I['foreign']
  protected _default?: I['default']
  protected _not_filter: NF[]

  private _cache: Data[] = []
  public has_cache: boolean

  // Transaction
  private static trx?: Knex.Transaction | null
  public static has_trx: boolean = false

  constructor(schema: Data, table_name: string, keys: I, not_filter: NF[], { cache = false }: { cache?: boolean }) {
    this._name = table_name

    this._primary = keys.primary
    this._increment = keys.increment
    this._foreign = keys.foreign

    this._not_filter = not_filter

    this.has_cache = cache
    // cache && this.initializeCache()
  }

  async insert(data: Insert) {
    const trx = Model.trx || db

    this.default(data)

    const id = await trx<Data>(this._name)
      .insert(data as any)
      .then(row => row[0])

    const result = { ...data } as unknown as Data

    if (this._increment) result[this._increment!] = <any>id
    this.has_cache && this._cache.push(result)

    return data
  }

  async update(primary: Primary, data: Update) {
    const trx = Model.trx || db

    await trx<Data>(this._name)
      .update(data as any)
      .where(primary)

    if (this.has_cache)
      this._cache = this._cache.map(value => {
        const should_update = Object.keys(this._primary).some(key => (<any>value)[key] !== (<any>primary)[key])
        return should_update ? { ...value, ...data } : value
      })
  }

  async delete(primary: Primary) {
    const trx = Model.trx || db

    await trx<Data>(this._name).del().where(primary)

    if (this.has_cache) this._cache = this._cache.filter(value => !Object.keys(this._primary).some(key => (<any>value)[key] !== (<any>primary)[key]))
  }

  find(filter?: Filter) {
    const trx = Model.trx || db

    const base_query = trx<Data, Data[]>(this._name).where(builder => {
      for (const key in filter) {
        if (filter[key] && !this._not_filter.some(nf_key => nf_key === (key as any))) {
          if (key === 'created_at' || key === 'updated_at') builder.whereBetween(<string>key, <any>filter[key])
          else if (Array.isArray(filter[key])) builder.whereIn(<any>key, <any>filter[key])
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

  private default(data: any) {
    for (const key in this._default) data[key] = this._default[key]
  }
}

// null! as User, // Workaround until Pull Request in Typescript of Partial Type Argument Inference

interface User {
  id: number
  name: string
  surname: string
  full_name: string
  phone: string | null
  birthday: string
  password: string
  avatar_uuid: string
  created_at: string
  updated_at: string
}

/*
  class Column {
    constructor() {}
  }

  class Schema<Data extends object> {
    constructor() {}
  }

  new Schema<User>(
      {
        id: schema.primary().increment().default('value').notFilter().virtual()
        name: string
        surname: string
        full_name: string
        phone: string | null
        birthday: string
        password: string
        avatar_uuid: string
        created_at: string
        updated_at: string
      }
  )

  Schema.createModel(table_name: string, options?: object): Model<User>
*/

new Model(
  null! as User,
  'user',
  {
    primary: ['id'],
    increment: 'id',
    default: { avatar_uuid: '', updated_at: '', created_at: '' },
    virtual: ['full_name']
  },
  ['avatar_uuid', 'full_name', 'name', 'surname'],
  { cache: true }
)

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
