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

export type Organization = {
  id: string
  name: string
  slug: string
}

export type Airport = {
  id: string
  name: string
  code_iata?: string
  code_icao?: string
  municipality?: string
}

export type Flight = {
  id: string
  flight_number: string
  departure_time?: string
  takeoff: Airport
  land: Airport
}

export type User = {
  id: string
  username: string
  first_name: string
  last_name: string
}

export type Measurement = {
  id: string
  name: string
  description?: string
  measurement_type: string
  time_start?: string
  time_end?: string
  time_created: string
  public: boolean
  author: User
  owner?: Organization
  flight?: Flight
  base_location_lat?: number
  base_location_lon?: number
  base_location_alt?: number
}
