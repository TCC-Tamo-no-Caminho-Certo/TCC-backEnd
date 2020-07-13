import joi from '@hapi/joi'


export default class Data {
  static processing(proposals: any[]) {
    let list = []
    let count = 0
    let k = 0

    for (let i = 0; i < proposals.length; i++) {
      if (count > 0) {
        --count
        continue
      }

      list[k] = { ...proposals[i] }
      list[k].category_name = [proposals[i].category_name]
      list[k].category_icon = [proposals[i].category_icon]
      list[k].users = [proposals[i].users]

      for (let j = i + 1; j < proposals.length; j++) {
        if (proposals[i].id === proposals[j].id) {
          ++count

          if (!list[k].category_name.some((category: string) => category === proposals[j].category_name))
            list[k].category_name.push(proposals[j].category_name)

          if (!list[k].category_icon.some((category: string) => category === proposals[j].category_icon))
            list[k].category_icon.push(proposals[j].category_icon)

          if (!list[k].users.some((id: number) => id === proposals[j].users))
            list[k].users.push(proposals[j].users)
        }
      }

      ++k
    }

    return list
  }

  static validate(data: Object, type: keyof typeof schema_list) {

    const schema_list = {
      user_register: joi.object({
        email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        name: joi.string().required(),
        sur_name: joi.string().required(),
        phone: joi.string(),
        password: joi.string().required(),
        role: joi.string().equal('professor', 'student', 'customer').required()
      }),
      user_login: joi.object({
        email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com'] } }).required(),
        password: joi.string().required()
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
      email: joi.object({
        email: joi.string()
          .email({ minDomainSegments: 2, tlds: { allow: ['com'] } })
          .required()
      })
    }

    const validation = schema_list[type].validate(data, { abortEarly: false })

    if (validation.error) throw validation.error
  }
}