export type UserRole =
  | "admin"
  | "sales"



export interface UserProfile {

  id: string

  name: string

  email?: string

  phone?: string

  whatsapp?: string

  role: UserRole

  /** Canonical CRM authorization state; inactive profiles are denied by the central loaders. */
  isActive?: boolean

  createdAt: string

  updatedAt: string

}
