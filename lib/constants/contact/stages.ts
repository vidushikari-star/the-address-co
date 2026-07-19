import type { BadgeVariant } from "@/components/shared/badge"

export const CONTACT_STAGE_CONFIG = {
  "New Lead": {
    label: "New Lead",
    variant: "outline",
    order: 1,
  },

  Contacted: {
    label: "Contacted",
    variant: "default",
    order: 2,
  },

  "Requirement Captured": {
    label: "Requirement Captured",
    variant: "default",
    order: 3,
  },

  "Site Visit Scheduled": {
    label: "Site Visit Scheduled",
    variant: "warning",
    order: 4,
  },

  "Site Visit Completed": {
    label: "Site Visit Completed",
    variant: "warning",
    order: 5,
  },

  Negotiation: {
    label: "Negotiation",
    variant: "warning",
    order: 6,
  },

  "Listing Signed": {
    label: "Listing Signed",
    variant: "success",
    order: 7,
  },

  Closed: {
    label: "Closed",
    variant: "success",
    order: 8,
  },

  Lost: {
    label: "Lost",
    variant: "danger",
    order: 9,
  },
} satisfies Record<
  string,
  {
    label: string
    variant: BadgeVariant
    order: number
  }
>

export type ContactStage = keyof typeof CONTACT_STAGE_CONFIG

export const CONTACT_STAGES = Object.keys(
  CONTACT_STAGE_CONFIG
) as ContactStage[]