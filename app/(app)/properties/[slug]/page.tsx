import { notFound } from "next/navigation"

import { getPropertyDetail } from "@/lib/services/property-service"

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function PropertyPage({
  params,
}: Props) {
  const { slug } = await params

  const detail = await getPropertyDetail(slug)

  if (!detail) {
    notFound()
  }

  const {
    property,
    relatedDeals,
  } = detail

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">
          {property.name}
        </h1>

        <p className="text-muted-foreground">
          {property.locality},{" "}
          {property.location}
        </p>
      </div>

      <div className="rounded-xl border p-6">
        <p>
          Related Deals: {relatedDeals.length}
        </p>
      </div>
    </div>
  )
}