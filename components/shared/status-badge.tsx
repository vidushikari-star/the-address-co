import { Badge } from "@/components/shared/badge"

type Status =
  | "New"
  | "Qualified"
  | "Site Visit"
  | "Negotiation"
  | "Closed"
  | "Lost"
  | "Active"
  | "Pending"
  | "Completed"

type StatusBadgeProps = {
  status: Status | string
}

const variants: Record<string, "default" | "success" | "warning" | "danger" | "outline"> = {
  New: "outline",

  Qualified: "default",

  "Site Visit": "default",

  Negotiation: "warning",

  Active: "success",

  Closed: "success",

  Completed: "success",

  Pending: "warning",

  Lost: "danger",
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <Badge variant={variants[status] ?? "default"}>
      {status}
    </Badge>
  )
}