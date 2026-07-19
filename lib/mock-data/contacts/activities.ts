import { Activity } from "@/types/activity"

export const activities: Activity[] = [
  {
    id: "1",

    type: "meeting",

    title: "Discovery Meeting",

    description:
      "Initial discussion regarding relocation to Goa.",

    createdAt: new Date("2026-07-18"),

    createdBy: "Vidushi Kari",

    contactId: "1",
  },

  {
    id: "2",

    type: "property_shared",

    title: "Shared 108 Horizon",

    description:
      "Brochure and pricing sent via WhatsApp.",

    createdAt: new Date("2026-07-17"),

    createdBy: "Vidushi Kari",

    contactId: "1",

    propertyId: "12",
  },

  {
    id: "3",

    type: "site_visit",

    title: "Site Visit Scheduled",

    description:
      "Visit confirmed for Friday at 11 AM.",

    createdAt: new Date("2026-07-15"),

    createdBy: "Vidushi Kari",

    contactId: "1",
  },
]