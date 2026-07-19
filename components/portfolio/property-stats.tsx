import { StatsRow } from "@/components/layout/stats-row"

export function PropertyStats() {
  return (
    <StatsRow
      stats={[
        {
          label: "Properties",
          value: "48",
        },
        {
          label: "Available",
          value: "34",
        },
        {
          label: "Reserved",
          value: "8",
        },
        {
          label: "Buyer Matches",
          value: "127",
        },
      ]}
    />
  )
}