import type { Activity } from "@/types/activity"

export const activities: Activity[] = [
  {
    id: "1",
    type: "meeting",
    title: "Discovery Meeting",
    description:
      "Initial discussion regarding relocation to Goa.",
    body:
      "Initial discussion regarding relocation to Goa.",
    date: "2026-07-18T10:00:00",
    createdAt: new Date("2026-07-18T10:00:00"),
    createdBy: "Vidushi Kari",
    userId: "user-1",
    contactId: "1",
  },
  {
    id: "2",
    type: "call",
    title: "Follow Up Call",
    description:
      "Discussed budget, preferred locations and requirements.",
    body:
      "Discussed budget, preferred locations and requirements.",
    date: "2026-07-19T12:00:00",
    createdAt: new Date("2026-07-19T12:00:00"),
    createdBy: "Vidushi Kari",
    userId: "user-1",
    contactId: "1",
  },
  {
    id: "3",
    type: "property_shared",
    title: "Property Shared",
    description:
      "Shared shortlisted luxury villa options.",
    body:
      "Shared shortlisted luxury villa options.",
    date: "2026-07-19T16:00:00",
    createdAt: new Date("2026-07-19T16:00:00"),
    createdBy: "Vidushi Kari",
    userId: "user-1",
    contactId: "1",
  },
]