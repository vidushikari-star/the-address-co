import type {
  UserProfile,
} from "@/types/user"



export function isAdmin(
  user: UserProfile | null
){

  return (
    user?.role === "admin"
  )

}





export function isSales(
  user: UserProfile | null
){

  return (
    user?.role === "sales"
  )

}





export function canManageFinance(
  user: UserProfile | null
){

  return (
    user?.role === "admin"
  )

}





export function canViewAllCommissions(
  user: UserProfile | null
){

  return (
    user?.role === "admin"
  )

}





export function canViewOwnCommissions(
  user: UserProfile | null
){

  return (
    user?.role === "sales"
    ||
    user?.role === "admin"
  )

}