import {
  supabase,
} from "@/lib/supabase/client"

import type {
  UserProfile,
} from "@/types/user"

type UserProfileRow = {
  id: string
  name: string
  email: string | null
  role: UserProfile["role"]
  created_at: string
  updated_at: string
}

function mapUser(
  row: UserProfileRow
): UserProfile {
  return {
    id:
      row.id,

    name:
      row.name,

    email:
      row.email ?? undefined,

    role:
      row.role,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "user_profiles"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

  if (error) {
    throw error
  }

  return (
    (data as UserProfileRow[] | null) ??
    []
  ).map(
    mapUser
  )
}