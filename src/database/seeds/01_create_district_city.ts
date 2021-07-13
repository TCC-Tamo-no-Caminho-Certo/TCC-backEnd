import { Knex } from 'knex'
import axios from 'axios'

export async function seed(knex: Knex) {
  // try {
  //   const trx = await knex.transaction()

  //   const result = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
  //   const ibge_districts: any[] = result.data

  //   const db_districts: any[] = await trx('district').select('name')

  //   for (const key in ibge_districts) {
  //     const insert_cities: any[] = []

  //     if (!db_districts || !db_districts.some(dist => dist.name === ibge_districts[key].nome)) {
  //       const district_id = await trx('district')
  //         .insert({ name: ibge_districts[key].nome, country_id: 1 })
  //         .then(row => (row[0] ? row[0] : null))

  //       const result = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ibge_districts[key].id}/municipios`)
  //       const ibge_cities: any[] = result.data

  //       const db_cities: any[] = await trx('city').select('name')

  //       for (const key in ibge_cities) {
  //         if (!db_cities || !db_cities.some(city => city.name === ibge_cities[key].nome))
  //           insert_cities.push({ name: ibge_cities[key].nome, district_id: district_id })
  //       }
  //     }

  //     await trx('city').insert(insert_cities)
  //   }

  //   await trx.commit()
  // } catch (error) {
  //   console.log('[WaARNNING] Seed 01 district/city failled', error)
  // }
}
