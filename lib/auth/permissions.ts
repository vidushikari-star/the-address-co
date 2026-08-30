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


/** Stable user_profiles/auth.users ID for the sole non-admin share manager. */
export const YASH_PUBLIC_SHARING_PROFILE_ID = "5a1cd0bc-e9db-430b-890e-bef393cf104b"

/**
 * Public sharing is intentionally a discrete capability. It does not change
 * a user's role or grant any other property or administration permission.
 */
export function canManagePropertyPublicSharing(
  user: UserProfile | null
){

  return (
    isAdmin(user)
    ||
    user?.id === YASH_PUBLIC_SHARING_PROFILE_ID
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
