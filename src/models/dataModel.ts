import joi, { SchemaMap } from '@hapi/joi'


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

    interface schemaList {
      user_register: SchemaMap
      user_login: SchemaMap
      address: SchemaMap
      proposal_get: SchemaMap
      proposal_post: SchemaMap
      proposal_patch: SchemaMap
      email: SchemaMap
    }

    const schema_list: schemaList = {
      user_register: {
        email: joi.string()
          .alphanum()
          .email()
          .required(),
        name: joi.string().required(),
        sur_name: joi.string().required(),
        password: joi.string()
          .min(6)
          .required(),
        role: joi.string().required()
      },
      user_login: {
        email: joi.string()
          .email()
          .required(),
        password: joi.string()
          .required()
      },
      address: {
        city: joi.string()
          .required(),
        address: joi.string()
          .required(),
        zip_code: joi.string()
          .required()
      },
      proposal_get: {
        titles: joi.array().items(joi.string()),
        version: joi.array().items(joi.number()),
        status: joi.array().items(joi.string()),
        categories: joi.array().items(joi.string())
      },
      proposal_post: {
        titles: joi.string().required(),
        version: joi.number().required(),
        status: joi.string().required(),
        categories: joi.array().items(joi.string()).required()
      },
      proposal_patch: {
        titles: joi.string(),
        version: joi.number(),
        status: joi.string(),
        categories: joi.array().items(joi.string())
      },
      email: {
        email: joi.string()
          .email()
          .required()
      }
    }

    return joi.object(schema_list[type]).validate(data, { abortEarly: false })
  }
}