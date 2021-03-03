import axios from 'axios'

interface SearchResult {
  score: number
  fields: { id: string; name: string }
}

interface SearchResponse {
  ok: boolean
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
    const response = await axios.post<SearchResponse>(`${this.baseUrl}/search`, {
      field: 'name',
      data: name,
      quantity
    })
    return response.data
  }

  async add(id: number, name: string) {
    const response = await axios.post(`${this.baseUrl}/add`, {
      fields: [
        {
          name: 'id',
          data: id.toString(),
          type: 1,
          store: 0
        },
        {
          name: 'name',
          data: name,
          type: 5,
          store: 0
        }
      ]
    })
    return response.data.ok === true
  }

  async delete(id: number) {
    const response = await axios.post(`${this.baseUrl}/add`, {
      field: 'id',
      data: id
    })
    return response.data.ok === true
  }

  async deleteAll() {
    const response = await axios.get(`${this.baseUrl}/delete-all`)
    return response.data.ok === true
  }
}

const searchManager = new SearchManager()
export default searchManager
