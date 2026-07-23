import { notFound } from "next/navigation"

import { RelationshipDetail } from "@/components/contacts/detail/relationship-detail"
import { PageContainer } from "@/components/layout/page-container"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

type ContactDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { id } = await params

  const contact =
    await ContactsRepository.getById(id)

  if (!contact) {
    notFound()
  }

  return (
    <PageContainer>
      <RelationshipDetail contact={contact} />
    </PageContainer>
  )
}