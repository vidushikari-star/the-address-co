import { supabase } from "@/lib/supabase/client"
import type { CommissionRecipient } from "@/types/commission-recipient"

type RecipientRow = {
  id: string
  name: string
  recipient_type: CommissionRecipient["recipientType"]
  company_name: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapRecipient(row: RecipientRow): CommissionRecipient {
  return {
    id: row.id,
    name: row.name,
    recipientType: row.recipient_type,
    companyName: row.company_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCommissionRecipients(
  activeOnly = true
): Promise<CommissionRecipient[]> {
  let query = supabase
    .from("commission_recipients")
    .select("*")
    .order("name")

  if (activeOnly) query = query.eq("is_active", true)

  const { data, error } = await query

  if (error) throw error
  return ((data as RecipientRow[] | null) ?? []).map(mapRecipient)
}

export async function getActiveCommissionRecipients(): Promise<CommissionRecipient[]> {
  return getCommissionRecipients(true)
}

export async function createCommissionRecipient(
  recipient: Pick<CommissionRecipient, "name" | "recipientType"> &
    Partial<Pick<CommissionRecipient, "companyName" | "phone" | "email" | "notes">>
): Promise<CommissionRecipient> {
  const name = recipient.name.trim()
  if (!name) throw new Error("Recipient name is required.")

  const { data, error } = await supabase
    .from("commission_recipients")
    .insert({
      name,
      recipient_type: recipient.recipientType,
      company_name: recipient.companyName?.trim() || null,
      phone: recipient.phone?.trim() || null,
      email: recipient.email?.trim() || null,
      notes: recipient.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return mapRecipient(data as RecipientRow)
}

export async function setCommissionRecipientActive(
  id: string,
  isActive: boolean
): Promise<CommissionRecipient> {
  const { data, error } = await supabase
    .from("commission_recipients")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return mapRecipient(data as RecipientRow)
}
