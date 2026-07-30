import { createServerSupabaseClient } from "@/lib/supabase/server"

export const ProfilesRepository = {
  async getCurrentProfile() {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("Auth user:", user)

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    console.log("Profile:", data)
    console.log("Profile error:", error)

    if (error) {
      return null
    }

    return data
  },
}