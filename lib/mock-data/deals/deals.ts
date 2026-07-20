import type { Deal } from "@/types/deal"

export const deals: Deal[] = [
  {
    id: "1",
    name: "Rajiv Shah • Casa Ekam",
    stage: "negotiation",
    contactId: "1",
    propertyId: "1",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 82500000,
      commissionPercentage: 2,
      commissionAmount: 1650000,
    },

    probability: 80,
    expectedCloseDate: "2026-08-15",

    priority: "high",

    tasks: [
      "Schedule final negotiation meeting",
      "Collect PAN & Aadhaar",
      "Share revised payment schedule",
    ],

    notes: [
      "Buyer prefers east-facing villas.",
      "Wants possession before Diwali.",
      "Family visit planned next week.",
    ],

    lastActivity: "Revised commercial offer shared yesterday",

    createdAt: "2026-07-10",
    updatedAt: "2026-07-20",
  },

  {
    id: "2",
    name: "Karan Malhotra • Casa Ekam",
    stage: "site_visit",
    contactId: "3",
    propertyId: "1",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 82500000,
      commissionPercentage: 2,
      commissionAmount: 1650000,
    },

    probability: 55,
    expectedCloseDate: "2026-09-05",

    priority: "medium",

    tasks: [
      "Confirm Saturday site visit",
      "Arrange airport pickup",
      "Share villa floor plans",
    ],

    notes: [
      "Interested in private pool villas only.",
      "Budget can stretch for the right property.",
    ],

    lastActivity: "Site visit confirmed for Saturday",

    createdAt: "2026-07-15",
    updatedAt: "2026-07-20",
  },

  {
    id: "3",
    name: "Ananya Mehta • 108 Horizon",
    stage: "property_shared",
    contactId: "2",
    propertyId: "2",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 42000000,
      commissionPercentage: 2,
      commissionAmount: 840000,
    },

    probability: 40,
    expectedCloseDate: "2026-09-20",

    priority: "medium",

    tasks: [
      "Follow up on brochure",
      "Share payment plan",
    ],

    notes: [
      "Looking for a sea-view apartment.",
    ],

    lastActivity: "Brochure and pricing shared",

    createdAt: "2026-07-18",
    updatedAt: "2026-07-20",
  },

  {
    id: "4",
    name: "Siddharth Kapoor • Alma & Forma",
    stage: "qualification",
    contactId: "4",
    propertyId: "3",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 57500000,
      commissionPercentage: 2,
      commissionAmount: 1150000,
    },

    probability: 25,
    expectedCloseDate: "2026-10-05",

    priority: "low",

    tasks: [
      "Qualification call",
      "Understand financing requirements",
    ],

    notes: [
      "Currently evaluating Goa vs Alibaug.",
    ],

    lastActivity: "Initial discovery call completed",

    createdAt: "2026-07-19",
    updatedAt: "2026-07-20",
  },

  {
    id: "5",
    name: "Priya Nair • Villa Verla",
    stage: "documentation",
    contactId: "5",
    propertyId: "4",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 95000000,
      commissionPercentage: 2,
      commissionAmount: 1900000,
    },

    probability: 95,
    expectedCloseDate: "2026-07-30",

    priority: "high",

    tasks: [
      "Collect signed agreement",
      "Coordinate registration",
      "Confirm final payment",
    ],

    notes: [
      "Lawyers reviewing final draft.",
      "Registration expected this week.",
    ],

    lastActivity: "Agreement sent for signature",

    createdAt: "2026-07-02",
    updatedAt: "2026-07-20",
  },

  {
    id: "6",
    name: "Rohan Desai • Assagao Villa",
    stage: "lead",
    contactId: "6",
    propertyId: "5",
    advisor: "Vidushi Kari",

    value: {
      propertyPrice: 120000000,
      commissionPercentage: 2,
      commissionAmount: 2400000,
    },

    probability: 10,
    expectedCloseDate: "2026-11-15",

    priority: "low",

    tasks: [
      "Call lead",
      "Understand budget",
    ],

    notes: [
      "Enquiry received through Instagram.",
    ],

    lastActivity: "Lead assigned",

    createdAt: "2026-07-20",
    updatedAt: "2026-07-20",
  },
]