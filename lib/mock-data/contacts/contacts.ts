import { Contact } from "@/types/contact"

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Rajiv Shah",
    type: "buyer",
    priority: "High",
    stage: "negotiation",

    budget: {
      min: 120000000,
      max: 150000000,
    },

    preferredLocations: [
      "Assagao",
      "Parra",
      "Siolim",
    ],

    propertyTypes: [
      "Villa",
    ],

    bedrooms: [4],

    timeline: "Within 6 months",

    advisor: "Vidushi Kari",

    phone: "+91 98765 43210",

    email: "rajiv@example.com",

    source: "Referral",

    nextMeeting: "Tomorrow • 11:00 AM",
  },

  {
    id: "2",
    name: "Ananya Mehta",
    type: "seller",
    priority: "Medium",
    stage: "closed",

    budget: {
      min: 80000000,
      max: 90000000,
    },

    preferredLocations: [
      "Dona Paula",
    ],

    propertyTypes: [
      "Apartment",
    ],

    bedrooms: [3],

    timeline: "Immediate",

    advisor: "Vidushi Kari",

    phone: "+91 98111 22334",

    email: "ananya@example.com",

    source: "Instagram",

    nextMeeting: "Friday • 2:00 PM",
  },

  {
    id: "3",
    name: "Karan Malhotra",
    type: "buyer",
    priority: "High",
    stage: "site_visit",

    budget: {
      min: 150000000,
      max: 180000000,
    },

    preferredLocations: [
      "Parra",
      "Saligao",
    ],

    propertyTypes: [
      "Villa",
    ],

    bedrooms: [4, 5],

    timeline: "Within 3 months",

    advisor: "Vidushi Kari",

    phone: "+91 98222 33445",

    email: "karan@example.com",

    source: "Website",

    nextMeeting: "Monday • 4:00 PM",
  },
]