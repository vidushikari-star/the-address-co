import { notFound } from "next/navigation"

import { getPropertyBySlug } from "@/lib/repositories/property-repository"

type Props = {
  params: {
    slug: string
  }
}

export default function PropertyDetailPage({
  params,
}: Props) {
  const property = getPropertyBySlug(params.slug)

  if (!property) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {property.name}
        </h1>

        <p className="text-muted-foreground">
          {property.locality}, {property.location}
        </p>
      </div>

      <div className="rounded-xl border p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Developer
            </p>

            <p className="font-medium">
              {property.developer}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Asking Price
            </p>

            <p className="font-medium">
              ₹{(property.price.asking / 10000000).toFixed(2)} Cr
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Bedrooms
            </p>

            <p className="font-medium">
              {property.specifications.bedrooms}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Bathrooms
            </p>

            <p className="font-medium">
              {property.specifications.bathrooms}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Carpet Area
            </p>

            <p className="font-medium">
              {property.specifications.carpetArea} sq.ft.
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Listing Type
            </p>

            <p className="font-medium">
              {property.listingType}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Development Stage
            </p>

            <p className="font-medium">
              {property.developmentStage}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Status
            </p>

            <p className="font-medium capitalize">
              {property.status.replace("_", " ")}
            </p>
          </div>
        </div>

        {property.tags?.length ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Features
            </p>

            <div className="flex flex-wrap gap-2">
              {property.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}