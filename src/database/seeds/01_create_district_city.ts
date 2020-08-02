import knex from 'knex'
import axios from 'axios'

// still not sure if store this fetch on DB or not
export async function seed(knex: knex) {
  try {
    const trx = await knex.transaction()
    const result = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
    const districts: any[] = result.data

    for (const key in districts) {
      const result = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${districts[key].id}/municipios`)
      const cities: any[] = result.data
      const insert_city: any[] = []

      let id_district = await trx('district')
        .where({ name: districts[key].nome })
        .then(row => (row[0] ? row[0].id_district : null))

      if (!id_district)
        id_district = await trx('district')
          .insert({ name: districts[key].nome, country_id: 1 })
          .then(row => (row[0] ? row[0] : null))

      for (const key in cities) {
        const has_city = await trx('city')
          .where({ name: cities[key].nome })
          .then(row => (row[0] ? row[0].id_city : null))

        if (!has_city) insert_city.push({ name: cities[key].nome, district_id: id_district })
      }

      await trx('city').insert(insert_city)
    }

    await trx.commit()
  } catch (error) {
    console.log('[WaARNNING] Seed 01 district/city failled')
  }
}
