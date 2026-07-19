import { properties } from "@/lib/mock-data/properties/properties"

import { PropertyCard } from "./property-card"

export function PropertyList() {
  return (
    <div className="space-y-5">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
        />
      ))}
    </div>
  )
}