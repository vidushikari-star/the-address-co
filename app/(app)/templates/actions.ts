"use server"

import { revalidatePath } from "next/cache"

import { TemplatesRepository } from "@/lib/supabase/repositories/templates.repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils/slug"

async function getUser() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

export async function createTemplate(formData: FormData) {
  const user = await getUser()

  const title = formData.get("title")?.toString().trim() ?? ""
  const channel = formData.get("channel")?.toString() ?? "whatsapp"
  const category = formData.get("category")?.toString() ?? "buyer"
  const subject = formData.get("subject")?.toString() ?? ""
  const body = formData.get("body")?.toString().trim() ?? ""

  if (!title) {
    throw new Error("Template title is required.")
  }

  if (!body) {
    throw new Error("Template body is required.")
  }

  await TemplatesRepository.create({
    title,
    slug: slugify(title),
    channel,
    category,
    subject: subject || null,
    body,
    created_by: user.id,
  })

  revalidatePath("/templates")
}

export async function updateTemplate(formData: FormData) {
  await getUser()

  const id = formData.get("id")?.toString()

  if (!id) {
    throw new Error("Template not found.")
  }

  const title = formData.get("title")?.toString().trim() ?? ""
  const channel = formData.get("channel")?.toString() ?? "whatsapp"
  const category = formData.get("category")?.toString() ?? "buyer"
  const subject = formData.get("subject")?.toString() ?? ""
  const body = formData.get("body")?.toString().trim() ?? ""

  if (!title) {
    throw new Error("Template title is required.")
  }

  if (!body) {
    throw new Error("Template body is required.")
  }

  await TemplatesRepository.update(id, {
    title,
    slug: slugify(title),
    channel,
    category,
    subject: subject || null,
    body,
  })

  revalidatePath("/templates")
}

export async function deleteTemplate(formData: FormData) {
  await getUser()

  const id = formData.get("id")?.toString()

  if (!id) {
    throw new Error("Template not found.")
  }

  await TemplatesRepository.delete(id)

  revalidatePath("/templates")
}