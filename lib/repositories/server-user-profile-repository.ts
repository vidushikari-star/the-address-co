import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getActiveAssignableUserProfilesForClient } from "@/lib/repositories/active-user-profile-query"

export async function getServerActiveAssignableUserProfiles() {
  const supabase = await createServerSupabaseClient()
  return getActiveAssignableUserProfilesForClient(supabase)
}
