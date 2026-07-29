import { createServerSupabaseClient } from "@/lib/supabase/server"

import type { UserProfile } from "@/types/user"

type UserProfileRow = {
  id: string
  name: string
  email: string | null
  role: UserProfile["role"]
  created_at: string
  updated_at: string
}

function mapUserProfile(
  row: UserProfileRow
): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getServerUserProfile(): Promise<UserProfile | null> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      `
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      `
    )
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error(
      "Failed to load user profile:",
      error
    )
    return null
  }

  if (!data) {
    return null
  }

  return mapUserProfile(data)
}