export interface HousingLead {
  lead_date: number

  lead_name: string
  lead_email: string
  lead_phone: string
  country_code: string

  apartment_names: string

  service_type: string
  category_type: string

  locality_name: string
  city_name: string

  min_area: number
  max_area: number

  min_price: number
  max_price: number

  flat_id: number

  project_name?: string

  property_field: string[]
}

export interface HousingApiError {
  details: string
  errorCode?: string
  error_code?: string
  displayPhrase?: string
  display_phrase?: string
}

export interface HousingLeadResponse {
  data: HousingLead[]

  apiErrors?: HousingApiError
  api_errors?: HousingApiError
}