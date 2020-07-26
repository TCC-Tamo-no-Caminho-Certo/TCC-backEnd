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
  id_proposal: number
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
        id_proposal: proposals[i].id_proposal,
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
        if (proposals[i].id_proposal === proposals[j].id_proposal) {
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
  }

  static validate(data: Object, type: keyof typeof schema_list) {
    const schema_list = {
      base_user_register: joi.object({
        email: joi.string().email().required(),
        name: joi.string().required(),
        sur_name: joi.string().required(),
        password: joi.string().required()
      }),

      complete_user_register: joi.object({
        phone: joi.string().allow(null),
        role: joi.string().equal('professor', 'student', 'customer', 'admin').required()
      }),

      user_patch: joi.object({
        name: joi.string().allow(null),
        sur_name: joi.string().allow(null),
        phone: joi.string().allow(null)
      }),

      user_login: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
      }),

      user_address_patch: joi
        .object({
          city: joi.string(),
          address: joi.string(),
          zip_code: joi.string()
        })
        .with('address', 'city')
        .with('address', 'zip_code'),

      forgot_password: joi.object({
        email: joi.string().email().required()
      }),

      address: joi.object({
        city: joi.string().required(),
        address: joi.string().required(),
        zip_code: joi.string().required()
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
