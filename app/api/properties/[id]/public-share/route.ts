import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

import { canManagePropertyPublicSharing } from "@/lib/auth/permissions"
import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const SettingsSchema = z.object({
  enabled: z.boolean(),
  showPrice: z.boolean(),
  showAdvisorContact: z.boolean(),
  showDocuments: z.boolean(),
  showExactAddress: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  advisorName: z.string().trim().max(160).nullable(),
  advisorPhone: z.string().trim().max(64).nullable(),
  advisorWhatsapp: z.string().trim().max(64).nullable(),
  advisorEmail: z.string().trim().email().max(320).nullable(),
  imageIds: z.array(z.string().uuid()).max(100),
  documentIds: z.array(z.string().uuid()).max(100),
}).superRefine((value, context) => {
  if (new Set(value.imageIds).size !== value.imageIds.length) {
    context.addIssue({ code: "custom", message: "Image selections must be unique.", path: ["imageIds"] })
  }

  if (new Set(value.documentIds).size !== value.documentIds.length) {
    context.addIssue({ code: "custom", message: "Document selections must be unique.", path: ["documentIds"] })
  }
})

type Context = { params: Promise<{ id: string }> }

function cleanOptional(value: string | null) {
  return value?.trim() || null
}

export async function PATCH(request: Request, context: Context) {
  const profile = await getServerUserProfile()
  if (!canManagePropertyPublicSharing(profile)) {
    return NextResponse.json({ error: "Public-sharing management access is required." }, { status: 403 })
  }

  const parsed = SettingsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid public share settings." }, { status: 400 })
  }

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id,public_share_token")
    .eq("id", id)
    .maybeSingle()

  if (propertyError) throw propertyError
  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 })

  const [images, documents] = await Promise.all([
    parsed.data.imageIds.length
      ? supabase.from("property_images").select("id").eq("property_id", id).in("id", parsed.data.imageIds)
      : Promise.resolve({ data: [], error: null }),
    parsed.data.documentIds.length
      ? supabase.from("property_documents").select("id,category").eq("property_id", id).in("id", parsed.data.documentIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (images.error) throw images.error
  if (documents.error) throw documents.error
  if ((images.data?.length ?? 0) !== parsed.data.imageIds.length || (documents.data?.length ?? 0) !== parsed.data.documentIds.length) {
    return NextResponse.json({ error: "Selected media must belong to this property." }, { status: 400 })
  }

  if ((documents.data ?? []).some((document) => !["brochure", "floor_plan"].includes(document.category ?? ""))) {
    return NextResponse.json({ error: "Only brochures and floor plans may be included in a public share." }, { status: 400 })
  }

  const token = property.public_share_token ?? crypto.randomUUID()
  const { error: updateError } = await supabase
    .from("properties")
    .update({
      public_share_token: token,
      public_share_enabled: parsed.data.enabled,
      public_share_show_price: parsed.data.showPrice,
      public_share_show_advisor_contact: parsed.data.showAdvisorContact,
      public_share_show_documents: parsed.data.showDocuments,
      public_share_show_exact_address: parsed.data.showExactAddress,
      public_share_expires_at: parsed.data.expiresAt,
      public_share_advisor_name: cleanOptional(parsed.data.advisorName),
      public_share_advisor_phone: cleanOptional(parsed.data.advisorPhone),
      public_share_advisor_whatsapp: cleanOptional(parsed.data.advisorWhatsapp),
      public_share_advisor_email: cleanOptional(parsed.data.advisorEmail),
    })
    .eq("id", id)

  if (updateError) throw updateError

  const { error: clearImagesError } = await supabase
    .from("property_images")
    .update({ public_share_allowed: false })
    .eq("property_id", id)
  if (clearImagesError) throw clearImagesError

  if (parsed.data.imageIds.length) {
    const { error } = await supabase
      .from("property_images")
      .update({ public_share_allowed: true })
      .eq("property_id", id)
      .in("id", parsed.data.imageIds)
    if (error) throw error
  }

  const { error: clearDocumentsError } = await supabase
    .from("property_documents")
    .update({ public_share_allowed: false })
    .eq("property_id", id)
  if (clearDocumentsError) throw clearDocumentsError

  if (parsed.data.documentIds.length) {
    const { error } = await supabase
      .from("property_documents")
      .update({ public_share_allowed: true })
      .eq("property_id", id)
      .in("id", parsed.data.documentIds)
    if (error) throw error
  }

  // The page also calls connection(), so it is rendered for every request.
  // Revalidation clears any route/client entries that may still exist after a
  // settings change or immediate revocation.
  revalidatePath(`/share/${token}`)
  revalidatePath("/share/[slug]", "page")

  return NextResponse.json({
    share: {
      enabled: parsed.data.enabled,
      token,
      url: `/share/${token}`,
    },
  })
}
