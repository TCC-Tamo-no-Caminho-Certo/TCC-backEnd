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
  public database: string = ''
  public enabled: boolean = false

  initialize(baseUrl: string, database: string) {
    this.enabled = true
    this.database = database
    this.baseUrl = baseUrl + '/v2'
  }

  async getDatabases() {
    const response = await axios.get(`${this.baseUrl}/databases`)
    return response.data
  }

  async createDatabase() {
    const response = await axios.post(`${this.baseUrl}/database`, {
      name: this.database
    })
    return response.data.ok === true
  }

  async search(name: string, from: number, to: number): Promise<SearchResponse> {
    const response = await axios.post<SearchResponse>(`${this.baseUrl}/search`, {
      field: 'name',
      data: name,
      database: this.database,
      from,
      to
    })
    return response.data
  }

  async searchBatch(names: string[], from: number, to: number): Promise<SearchResponse> {
    let data: { searchs: any[] } = {
      searchs: []
    }
    names.forEach(name => {
      data.searchs.push({
        field: 'name',
        data: name,
        database: this.database,
        from,
        to
      })
    })
    const response = await axios.post<SearchResponse>(`${this.baseUrl}/search-batch`, data)
    return response.data
  }

  async add(document: SearchDocument) {
    const response = await axios.post(`${this.baseUrl}/document`, {
      database: this.database,
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
          store: 1
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
        database: this.database,
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
            store: 1
          }
        ]
      })
    })
    const response = await axios.post(`${this.baseUrl}/documents`, data)
    return response.data.ok === true
  }

  async delete(id: number) {
    const response = await axios.delete(`${this.baseUrl}/document`, {
      data: {
        database: this.database,
        field: 'id',
        data: id.toString()
      }
    })
    return response.data.ok === true
  }

  async deleteAll() {
    const response = await axios.delete(`${this.baseUrl}/documents`, {
      data: {
        database: this.database
      }
    })
    return response.data.ok === true
  }
}

const searchManager = new SearchManager()
export default searchManager
