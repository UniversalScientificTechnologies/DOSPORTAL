export type LogbookItem = {
  id: string
  detector: string
  text: string
  entry_type: string
  source: string
  created: string
  modified?: string
  author?: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  modified_by?: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  latitude?: number
  longitude?: number
  location_text?: string
}

export type DetectorManufacturer = {
  id: string
  name: string
  url?: string
}

export type DetectorType = {
  id: string
  name: string
  manufacturer: DetectorManufacturer
  url?: string
  description?: string
}

export type Detector = {
  id: string
  name: string
  sn: string
  type: DetectorType
  owner?: {
    id: string
    name: string
    slug: string
  }
  manufactured_date?: string
  data?: Record<string, unknown>
}
