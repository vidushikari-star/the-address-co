"use server"

import { revalidatePath } from "next/cache"

import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

function split(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/[\n,]/).map(item => item.trim()).filter(Boolean)
}

export async function saveMarketingBrandSettings(formData: FormData) {
  await requireMarketingAdminPage()
  await MarketingRepository.upsertBrandSettings({
    brandName: String(formData.get("brandName") ?? "").trim() || null,
    instagramHandle: String(formData.get("instagramHandle") ?? "").trim().replace(/^@/, "") || null,
    website: String(formData.get("website") ?? "").trim() || null,
    whatsappCta: String(formData.get("whatsappCta") ?? "").trim() || null,
    preferredTone: String(formData.get("preferredTone") ?? "").trim() || "Premium, sophisticated, aspirational luxury real estate.",
    preferredCta: String(formData.get("preferredCta") ?? "").trim() || null,
    defaultHashtags: split(formData.get("defaultHashtags")),
    excludedWords: split(formData.get("excludedWords")),
    fontFamily: String(formData.get("fontFamily") ?? "").trim() || null,
    brandColors: { primary: String(formData.get("primaryColor") ?? "").trim(), accent: String(formData.get("accentColor") ?? "").trim() },
    timezone: String(formData.get("timezone") ?? "Asia/Kolkata"),
  })
  revalidatePath("/marketing")
  revalidatePath("/marketing/settings")
}
