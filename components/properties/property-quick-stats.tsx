import {
  Bath,
  BedDouble,
  Home,
  LandPlot,
  Ruler,
} from "lucide-react"

import type { Property } from "@/types/property"

type PropertyQuickStatsProps = {
  property: Property
}

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function StatCard({
  icon,
  label,
  value,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        bg-card
        p-5
        transition-all
        duration-200
        hover:-translate-y-1
        hover:border-primary/20
        hover:shadow-md
      "
    >
      <div
        className="
          mb-4
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-primary/10
          text-primary
        "
      >
        {icon}
      </div>

      <p
        className="
          text-2xl
          font-bold
          tracking-tight
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-sm
          text-muted-foreground
        "
      >
        {label}
      </p>
    </div>
  )
}

export function PropertyQuickStats({
  property,
}: PropertyQuickStatsProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">
          Quick Stats
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Key specifications at a glance.
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-3
        "
      >
        <StatCard
          icon={<BedDouble className="h-5 w-5" />}
          label="Bedrooms"
          value={`${property.specifications.bedrooms}`}
        />

        <StatCard
          icon={<Bath className="h-5 w-5" />}
          label="Bathrooms"
          value={`${property.specifications.bathrooms}`}
        />

        <StatCard
          icon={<Ruler className="h-5 w-5" />}
          label="Carpet Area"
          value={
            property.specifications.carpetArea
              ? `${property.specifications.carpetArea.toLocaleString()} sqft`
              : "—"
          }
        />

        <StatCard
          icon={<LandPlot className="h-5 w-5" />}
          label="Plot Area"
          value={
            property.specifications.plotArea
              ? `${property.specifications.plotArea.toLocaleString()} sqm`
              : "—"
          }
        />

        <StatCard
          icon={<Home className="h-5 w-5" />}
          label="Built-up Area"
          value={
            property.specifications.builtUpArea
              ? `${property.specifications.builtUpArea.toLocaleString()} sqft`
              : "—"
          }
        />
      </div>
    </section>
  )
}