import type { SupabaseClient } from "@supabase/supabase-js"

import type { UserProfile } from "@/types/user"

type UserProfileRow = {
  id: string
  name: string
  email: string | null
  role: UserProfile["role"]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function mapUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Canonical source for profiles that may receive a new CRM assignment.
 * Historical by-ID lookups intentionally do not use this query.
 */
export async function getActiveAssignableUserProfilesForClient(
  client: SupabaseClient
): Promise<UserProfile[]> {
  const { data, error } = await client
    .from("user_profiles")
    .select("id,name,email,role,is_active,created_at,updated_at")
    .eq("is_active", true)
    .order("name")

  if (error) {
    throw error
  }

  return ((data as UserProfileRow[] | null) ?? []).map(mapUserProfile)
}
