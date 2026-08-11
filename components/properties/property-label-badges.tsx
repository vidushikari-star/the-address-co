import type { Property } from "@/types/property"

type Props = {
  property: Pick<Property, "transactionType" | "developmentStage" | "furnishing">
  className?: string
}

const developmentLabels: Record<Property["developmentStage"], string> = {
  ready_to_move: "Ready to Move",
  under_construction: "Under Construction",
  resale: "Resale",
}

const furnishingLabels = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
} as const

export function PropertyLabelBadges({ property, className }: Props) {
  const labels = [
    property.transactionType === "Rental" ? "Rent" : "Sale",
    developmentLabels[property.developmentStage],
    property.furnishing ? furnishingLabels[property.furnishing] : null,
  ].filter((label): label is string => Boolean(label))

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`} aria-label="Property labels">
      {labels.map(label => (
        <span key={label} className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
          {label}
        </span>
      ))}
    </div>
  )
}
