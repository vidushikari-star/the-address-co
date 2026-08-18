import { supabase } from "@/lib/supabase/client"

export type CrmDraftWorkflow = "property" | "relationship" | "deal"

export type CrmDraft = {
  id: string
  workflow: CrmDraftWorkflow
  payload: Record<string, unknown>
  updatedAt: string
}

export async function getCrmDraft(workflow: CrmDraftWorkflow): Promise<CrmDraft | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Sign in to load a CRM draft.")
  const { data, error } = await supabase
    .from("crm_drafts")
    .select("id,workflow,payload,updated_at")
    .eq("owner_id", user.id)
    .eq("workflow", workflow)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    workflow: data.workflow,
    payload: (data.payload && typeof data.payload === "object" && !Array.isArray(data.payload) ? data.payload : {}) as Record<string, unknown>,
    updatedAt: data.updated_at,
  }
}

export async function listCrmDrafts(): Promise<CrmDraft[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Sign in to load CRM drafts.")

  const { data, error } = await supabase
    .from("crm_drafts")
    .select("id,workflow,payload,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((draft) => ({
    id: draft.id,
    workflow: draft.workflow,
    payload: (draft.payload && typeof draft.payload === "object" && !Array.isArray(draft.payload) ? draft.payload : {}) as Record<string, unknown>,
    updatedAt: draft.updated_at,
  }))
}

export async function saveCrmDraft(workflow: CrmDraftWorkflow, payload: Record<string, unknown>): Promise<CrmDraft> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Sign in to save a CRM draft.")
  const { data, error } = await supabase
    .from("crm_drafts")
    .upsert({
      owner_id: user.id,
      workflow,
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_id,workflow" })
    .select("id,workflow,payload,updated_at")
    .single()
  if (error) throw error
  return {
    id: data.id,
    workflow: data.workflow,
    payload: (data.payload && typeof data.payload === "object" && !Array.isArray(data.payload) ? data.payload : {}) as Record<string, unknown>,
    updatedAt: data.updated_at,
  }
}

export async function deleteCrmDraft(workflow: CrmDraftWorkflow) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from("crm_drafts")
    .delete()
    .eq("owner_id", user.id)
    .eq("workflow", workflow)
  if (error) throw error
}
