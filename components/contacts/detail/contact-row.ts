export interface ContactRow {
  id: string

  first_name: string | null
  last_name: string | null
  full_name: string

  phone: string
  email: string | null

  city: string | null
  country: string | null

  created_at: string
}