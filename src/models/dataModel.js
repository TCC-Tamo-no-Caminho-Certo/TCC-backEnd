module.exports = class Data {
  static processing(proposals = []) {
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
      list[k].user_id = [proposals[i].user_id]

      for (let j = i + 1; j < proposals.length; j++) {
        if (proposals[i].id === proposals[j].id) {
          ++count

          if (!list[k].category_name.some(category => category === proposals[j].category_name))
            list[k].category_name.push(proposals[j].category_name)

          if (!list[k].user_id.some(id => id === proposals[j].user_id))
            list[k].user_id.push(proposals[j].user_id)
        }
      }

      ++k
    }

    return list
  }

  validation(data = {}, type = '') {

    if (type === 'user') {

    }

    if (type === 'address') {

    }

    throw new Error('Type of validation not provided or wrong!')

  }
}