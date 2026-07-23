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

  createdAt: string

  updatedAt: string

}