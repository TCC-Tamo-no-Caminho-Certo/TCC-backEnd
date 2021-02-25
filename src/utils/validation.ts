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
    joi: joi,

    auth: {
      token: joi.string(),
      remember: joi.bool()
    },

    user: {
      email: joi.string().email(),
      name: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
      surname: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
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
      string: joi.array().items(joi.string()),
      number: joi.array().items(joi.number()),
      ids: joi.array().items(joi.number().integer().greater(0)),
      names: joi.array().items(joi.string().regex(/^([a-zà-ú]\s?)+$/i)),
      date: joi
        .array()
        .items(joi.string().regex(/^2[01]\d{2}-[01]\d-[0123]\d$/))
        .length(2)
    } // specify all filters validations
  }
}

/**
 * primitive schemas
 */
export const P = ValSchema.primitive
