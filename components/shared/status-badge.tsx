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
  | "Archived"


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

  Archived: "outline",

  archived: "outline",

  available: "success",

  viewed: "default",

  shortlisted: "warning",

  offer: "warning",

  purchased: "success",
}


export function StatusBadge({
  status,
}: StatusBadgeProps) {

  return (

    <Badge

    
      variant={
        variants[status] ?? "default"
      }
    >

      {status}

    </Badge>

  )

}