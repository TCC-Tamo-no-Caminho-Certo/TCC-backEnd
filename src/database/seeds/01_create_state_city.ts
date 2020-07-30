import knex from 'knex'
import axios from 'axios'

// still not sure if store this fetch on DB or not
export async function seed(knex: knex) {
  const trx = await knex.transaction()
  const result = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
  const states: any[] = result.data

  for (const key in states) {
    const result = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${states[key].id}/municipios`)
    const cities: any[] = result.data
    const insert_city: any[] = []

    let id_state = await trx('state')
      .where({ state: states[key].nome })
      .then(row => (row[0] ? row[0].id_state : null))

    if (!id_state)
      id_state = await trx('state')
        .insert({ state: states[key].nome, country_id: 1 })
        .then(row => (row[0] ? row[0] : null))

    for (const key in cities) {
      const has_city = await trx('city')
        .where({ city: cities[key].nome })
        .then(row => (row[0] ? row[0].id_city : null))

      if (!has_city) insert_city.push({ city: cities[key].nome, state_id: id_state })
    }

    await trx('city').insert(insert_city)
  }

  await trx.commit()
}
