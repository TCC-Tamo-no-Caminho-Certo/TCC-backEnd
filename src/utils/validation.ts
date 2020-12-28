import joi, { AnySchema } from 'joi'

type SchemaType = { [key in keyof any]?: AnySchema } | AnySchema

type SchemaData<ST extends SchemaType | AnySchema> = ST extends AnySchema ? any : { [key in keyof ST]: any }

export default class ValSchema<T extends SchemaType> {
  schema: T

  constructor(schema: T) {
    this.schema = schema
  }

  validate<T extends ValSchema<this['schema']>['schema'] = this['schema']>(data: SchemaData<T>) {
    const validation = (this.schema.type ? (this.schema as AnySchema) : joi.object(this.schema as object)).validate(data, { abortEarly: false })

    if (validation.error) throw validation.error
  }

  static primitive = {
    auth: {
      token: joi.string(),
      remember: joi.bool()
    },

    user: {
      email: joi.string().email(),
      name: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
      surname: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
      cpf: joi.string().regex(/[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}/i),
      password: joi.string(),
      birthday: joi.string().regex(/^[12][8901]\d{2}-[01]\d-[0123]\d$/),
      phone: joi.string().regex(/^\(\d\d\)\d{5}-\d{4}$/),
      role: joi.string()
    },

    proposal: {
      title: joi.string(),
      version: joi.number(),
      status: joi.string(),
      categories: joi.array().items(joi.string())
    },

    p_category: {
      name: joi.string(),
      icon: joi.string(),
      description: joi.string()
    },

    p_status: {
      name: joi.string(),
      icon: joi.string(),
      description: joi.string()
    },

    address: {
      city: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
      address: joi.string(),
      postal_code: joi.string().regex(/^\d{5}-\d{3}$/)
    },

    filter: {
      ids: joi.array().items(joi.number()),
      titles: joi.array().items(joi.string()),
      version: joi.array().items(joi.number()),
      status: joi.array().items(joi.string()),
      categories: joi.array().items(joi.string()),
      users: joi.array().items(joi.number()),
      created_at: joi.array().items(joi.string()),
      updated_at: joi.array().items(joi.string())
    }
  }
}

/**
 * primitive schemas
 */
export const P = ValSchema.primitive
