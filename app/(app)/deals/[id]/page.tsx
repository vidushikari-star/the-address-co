import { notFound } from "next/navigation"

import { getDealById } from "@/lib/repositories/deal-repository"
import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import { getPropertyById } from "@/lib/repositories/property-repository"

import { Badge } from "@/components/ui/badge"

type DealPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function DealPage({
  params,
}: DealPageProps) {
  const { id } = await params

  const deal = getDealById(id)

  if (!deal) {
    notFound()
  }

  const contact =
    await ContactsRepository.getById(
      deal.contactId
    )

  const property = getPropertyById(
    deal.propertyId
  )

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">
          Deal
        </h1>

        <Badge className="mt-2">
          {deal.stage}
        </Badge>
      </div>

      <div className="rounded-xl border p-6 space-y-2">
        <p>
          Buyer: {contact.name}
        </p>

        <p>
          Property: {property?.name ?? "Not assigned"}
        </p>
      </div>
    </div>
  )
}