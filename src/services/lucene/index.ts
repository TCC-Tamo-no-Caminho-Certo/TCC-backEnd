import axios from "axios";
import logger from '../../services/logger'

interface SearchResult {
  score: number,
  fields: { id: string, name: string }
}

interface SearchResponse {
  ok: boolean,
  results: SearchResult[] | null
}

class SearchManager {
  public baseUrl: string = ''
  public enabled: boolean = false

  initialize(baseUrl: string) {
    this.enabled = true
    this.baseUrl = baseUrl
  }

  async search(name: string, quantity: number): Promise<SearchResponse> {
    let response = await axios.post<SearchResponse>(`${this.baseUrl}/search`, {
      field: 'name',
      data: name,
      quantity,
    })
    logger.info(response.data)
    return response.data
  }

  async add(id: number, name: string) {
    let response = await axios.post(`${this.baseUrl}/add`, {
      fields: [
        {
          name: 'id',
          data: id.toString(),
          type: 1,
          store: 0,
        },
        {
          name: 'name',
          data: name,
          type: 5,
          store: 0,
        },
      ],
    })
    logger.info(response.data)
    return response.data.ok === true
  }

  async delete(id: number) {
    let response = await axios.post(`${this.baseUrl}/add`, {
      field: 'id',
      data: id
    })
    logger.info(response.data)
    return response.data.ok === true
  }

  async deleteAll() {
    let response = await axios.get(`${this.baseUrl}/delete-all`)
    logger.info(response.data)
    return response.data.ok === true
  }
}

const searchManager = new SearchManager()
export default searchManager
