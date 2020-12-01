import joi from 'joi'

interface User {
  user_id: number
  permission: string
}

interface Status {
  name: string
  icon: string
  description: string
}

interface Category {
  name: string
  icon: string
  description: string
}

interface ProposalList {
  proposal_id: number
  created_at: string
  updated_at: string
  title: string
  version: number
  status: Status
  categories: Category[]
  users: User[]
  artefact_name: string
  path: string
  hash_verification: string
  artefact_description: string
}

export default class Data {
  // DB data
  static processing(proposals: any[]) {
    const list: ProposalList[] = []
    let count = 0
    let k = 0

    for (let i = 0; i < proposals.length; i++) {
      if (count > 0) {
        --count
        continue
      }

      list[k] = {
        proposal_id: proposals[i].proposal_id,
        created_at: proposals[i].created_at,
        updated_at: proposals[i].updated_at,
        title: proposals[i].title,
        version: proposals[i].version,
        status: {
          name: proposals[i].status_name,
          icon: proposals[i].status_icon,
          description: proposals[i].status_description
        },
        categories: [
          {
            name: proposals[i].category_name,
            icon: proposals[i].category_icon,
            description: proposals[i].category_description
          }
        ],
        users: [
          {
            user_id: proposals[i].user_id,
            permission: proposals[i].permission
          }
        ],
        artefact_name: proposals[i].artefact_name,
        path: proposals[i].path,
        hash_verification: proposals[i].hash_verification,
        artefact_description: proposals[i].artefact_description
      }

      for (let j = i + 1; j < proposals.length; j++) {
        if (proposals[i].proposal_id === proposals[j].proposal_id) {
          ++count

          if (!list[k].categories.some((category: Category) => category.name === proposals[j].category_name))
            list[k].categories.push({
              name: proposals[j].category_name,
              icon: proposals[j].category_icon,
              description: proposals[j].category_description
            })

          if (!list[k].users.some((user: User) => user.user_id === proposals[j].user_id))
            list[k].users.push({
              user_id: proposals[j].user_id,
              permission: proposals[j].permission
            })
        }
      }

      ++k
    }

    return list
  } // move to proposal utils!

  static parseDatetime(data: any) {
    const created: Date = data.created_at
    const updated: Date = data.updated_at
    const birthday: Date = data.birthday
    if (created) data.created_at = created.toISOString().slice(0, 19).replace('T', ' ')
    if (updated) data.updated_at = updated.toISOString().slice(0, 19).replace('T', ' ')
    if (birthday) data.birthday = birthday.toISOString().slice(0, 10)
    return data
  }

  // Client data
  static validate(data: any, type: keyof typeof schema_list) {
    const primitive = {
      auth: {
        token: joi.string(),
        remember: joi.bool()
      },

      user: {
        email: joi.string().email(),

        name: joi.string().regex(/^([a-zà-ú]\s?)+$/i),

        surname: joi
          .string()
          .regex(/^([a-zà-ú]\s?)+$/i)
          .required(),

        password: joi.string(),

        birthday: joi.string().regex(/^[12][8901]\d{2}-[01]\d-[0123]\d$/),

        phone: joi.string().regex(/^\(\d\d\)\d{5}-\d{4}$/),

        role: joi.string().equal('professor', 'student', 'customer', 'evaluator', 'moderator')
      },

      address: {
        city: joi.string().regex(/^([a-zà-ú]\s?)+$/i),
        address: joi.string(),
        postal_code: joi.string().regex(/^\d{5}-\d{3}$/)
      }
    }

    const schema_list = {
      token: primitive.auth.token.required(),

      email: primitive.user.email.required(),

      password: primitive.user.password.required(),

      register: joi.object({
        email: joi.array().items(joi.string().email()).required(),
        name: primitive.user.name.required(),
        surname: primitive.user.surname.required(),
        password: primitive.user.password.required(),
        birthday: primitive.user.birthday.required()
      }),

      complete_register: joi.object({
        phone: primitive.user.phone.allow(null),
        role: primitive.user.role.required()
      }),

      user_patch: joi.object({
        name: primitive.user.name.allow(null),
        surname: primitive.user.surname.allow(null),
        birthday: primitive.user.birthday.allow(null),
        phone: primitive.user.phone.allow(null),
        new_password: primitive.user.password,
        password: primitive.user.password.required()
      }),

      // user_patch_address: joi
      //   .object({
      //     city: primitive.address.city,
      //     address: primitive.address.address,
      //     postal_code: primitive.address.postal_code
      //   })
      //   .with('address', 'city')
      //   .with('address', 'postal_code'),

      login: joi.object({
        email: primitive.user.email.required(),
        password: primitive.user.password.required(),
        remember: primitive.auth.remember.allow(null)
      }),

      address: joi.object({
        city: primitive.address.city.required(),
        address: primitive.address.address.required(),
        postal_code: primitive.address.postal_code.required()
      }),

      proposal_get: joi.object({
        ids: joi.array().items(joi.number()).allow(null),
        titles: joi.array().items(joi.string()).allow(null),
        version: joi.array().items(joi.number()).allow(null),
        status: joi.array().items(joi.string()).allow(null),
        categories: joi.array().items(joi.string()).allow(null),
        users: joi.array().items(joi.number()).allow(null),
        created_at: joi.array().items(joi.string()).allow(null),
        updated_at: joi.array().items(joi.string()).allow(null)
      }),

      proposal_post: joi.object({
        title: joi.string().required(),
        version: joi.number().required(),
        status: joi.string().required(),
        categories: joi.array().items(joi.string()).required()
      }),

      proposal_patch: joi.object({
        title: joi.string().allow(null),
        version: joi.number().allow(null),
        status: joi.string().allow(null),
        categories: joi.array().items(joi.string()).allow(null)
      }),

      category_post: joi.object({
        name: joi.string().required(),
        icon: joi.string().required(),
        description: joi.string().required()
      }),

      category_patch: joi.object({
        name: joi.string().allow(null),
        icon: joi.string().allow(null),
        description: joi.string().allow(null)
      }),

      status_post: joi.object({
        name: joi.string().required(),
        icon: joi.string().required(),
        description: joi.string().required()
      }),

      status_patch: joi.object({
        name: joi.string().allow(null),
        icon: joi.string().allow(null),
        description: joi.string().allow(null)
      })
    }

    const validation = schema_list[type].validate(data, { abortEarly: false })

    if (validation.error) throw validation.error
  }
}
