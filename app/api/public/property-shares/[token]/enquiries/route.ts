import { NextResponse } from "next/server"
import { z } from "zod"

import { getPublicPropertyShareRecord } from "@/lib/public/property-share"
import { takePublicShareEnquiryRequest } from "@/lib/public/public-share-enquiry-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const EnquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(64),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  message: z.string().trim().max(2_000).optional().or(z.literal("")),
})

type Context = { params: Promise<{ token: string }> }

function splitName(name: string) {
  const parts = name.split(/\s+/)
  return { firstName: parts.shift() ?? name, lastName: parts.join(" ") || null }
}

function requestClientKey(request: Request, token: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return `${forwarded || "unknown"}:${token}`
}

export async function POST(request: Request, context: Context) {
  const { token } = await context.params
  if (!takePublicShareEnquiryRequest(requestClientKey(request, token))) {
    return NextResponse.json({ error: "Please wait before submitting another enquiry." }, { status: 429 })
  }

  const parsed = EnquirySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your name, phone number, and a valid email if supplied." }, { status: 400 })
  }

  const sharedProperty = await getPublicPropertyShareRecord(token)
  if (!sharedProperty) return NextResponse.json({ error: "This property share is unavailable." }, { status: 404 })

  const { firstName, lastName } = splitName(parsed.data.name)
  const admin = createAdminSupabaseClient()
  const note = [
    `Public property-share enquiry for: ${sharedProperty.share.title}`,
    parsed.data.message || null,
  ].filter(Boolean).join("\n\n")

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .insert({
      first_name: firstName,
      last_name: lastName,
      phone: parsed.data.phone,
      whatsapp: parsed.data.phone,
      email: parsed.data.email || null,
      lead_source: "property_share",
      property_type: sharedProperty.share.propertyType?.toLowerCase() ?? null,
      locations: sharedProperty.share.location ? [sharedProperty.share.location] : null,
      notes: note,
    })
    .select("id")
    .single()

  if (contactError || !contact) throw contactError ?? new Error("Unable to create contact")

  const { error: activityError } = await admin
    .from("activities")
    .insert({
      contact_id: contact.id,
      property_id: sharedProperty.propertyId,
      type: "contact_created",
      title: "New Property Enquiry",
      description: `${parsed.data.name} enquired about ${sharedProperty.share.title}`,
      body: note,
      activity_date: new Date().toISOString(),
    })

  if (activityError) throw activityError
  return NextResponse.json({ ok: true }, { status: 201 })
}
