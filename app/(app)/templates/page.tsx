import { TemplatesClient } from "@/components/templates/templates-client"
import { TemplatesRepository } from "@/lib/supabase/repositories/templates.repository"

export default async function TemplatesPage() {
  const templates = await TemplatesRepository.list()

  return <TemplatesClient templates={templates} />
}