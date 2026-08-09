import { createServerSupabaseClient } from "@/lib/supabase/server"

export const ProfilesRepository = {
  async getCurrentProfile() {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      return null
    }

    return data
  },
}
