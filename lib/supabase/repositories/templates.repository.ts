import { createServerSupabaseClient } from "@/lib/supabase/server"

type TemplateInsert = {
  title: string
  slug: string
  channel: string
  category: string
  subject: string | null
  body: string
  created_by: string
}

type TemplateUpdate = {
  title: string
  slug: string
  channel: string
  category: string
  subject: string | null
  body: string
}

export const TemplatesRepository = {
  async list() {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return data
  },

  async findById(id: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return data
  },

  async findBySlug(slug: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error) throw error

    return data
  },

  async create(values: TemplateInsert) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .insert(values)
      .select()
      .single()

    if (error) throw error

    return data
  },

  async update(id: string, values: TemplateUpdate) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .update(values)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data
  },

  async delete(id: string) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("communications_templates")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  async archive(id: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("communications_templates")
      .update({
        is_active: false,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data
  },

  async incrementUsage(id: string) {
    const supabase = await createServerSupabaseClient()

    const template = await this.findById(id)

    const { error } = await supabase
      .from("communications_templates")
      .update({
        usage_count: (template.usage_count ?? 0) + 1,
      })
      .eq("id", id)

    if (error) throw error
  },
}