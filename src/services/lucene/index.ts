import axios from 'axios'

interface SearchResult {
  score: number
  fields: { id: string; name: string }
}

interface SearchResponse {
  ok: boolean
  results: SearchResult[] | null
}

interface SearchDocument {
  id: number
  name: string
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

  async searchBatch(names: string[], quantity: number): Promise<SearchResponse> {
    let data: { searchs: any[] } = {
      searchs: []
    }
    names.forEach(name => {
      data.searchs.push({
        field: 'name',
        data: name,
        quantity
      })
    })
    const response = await axios.post<SearchResponse>(`${this.baseUrl}/search-batch`, data)
    return response.data
  }

  async add(document: SearchDocument) {
    const response = await axios.post(`${this.baseUrl}/add`, {
      fields: [
        {
          name: 'id',
          data: document.id.toString(),
          type: 1,
          store: 0
        },
        {
          name: 'name',
          data: document.name,
          type: 5,
          store: 0
        }
      ]
    })
    return response.data.ok === true
  }

  async addBatch(documents: SearchDocument[]) {
    let data: { documents: any[] } = {
      documents: []
    }
    documents.forEach(document => {
      data.documents.push({
        fields: [
          {
            name: 'id',
            data: document.id.toString(),
            type: 1,
            store: 0
          },
          {
            name: 'name',
            data: document.name,
            type: 5,
            store: 0
          }
        ]
      })
    })
    const response = await axios.post(`${this.baseUrl}/add-batch`, data)
    return response.data.ok === true
  }

  async delete(id: number) {
    const response = await axios.post(`${this.baseUrl}/delete`, {
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
