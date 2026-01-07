export type LogbookItem = {
  id: string
  detector: string
  text: string
  entry_type: string
  source: string
  created: string
  author?: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  latitude?: number
  longitude?: number
}
