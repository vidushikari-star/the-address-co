import type { Contact } from "@/types/contact"

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Rajiv Shah",
    phone: "+91 98765 43210",
    email: "rajiv@example.com",

    stage: "negotiating",

    assignedAdvisor: "Vidushi Kari",

    buyerProfile: {
      nationality: "Indian",
      city: "Mumbai",
      countryOfResidence: "India",
      occupation: "Entrepreneur",
      company: "Shah Holdings",
      preferredCommunication: "whatsapp",
    },

    buyerRequirements: {
      budget: {
        min: 120000000,
        max: 150000000,
      },

      preferredLocations: [
        "Assagao",
        "Parra",
        "Siolim",
      ],

      propertyTypes: ["villa"],

      bedrooms: 4,

      lookingFor: "both",

      purpose: "holiday_home",

      timeline: "3_6_months",

      financing: "cash",

      developerPreference: "",

      minimumCarpetArea: 3500,

      privatePool: true,

      gatedCommunity: true,

      seaView: false,

      riverView: false,

      petFriendly: true,

      staffQuarters: true,

      furnishing: "furnished",
    },

    leadInformation: {
      source: "referral",
      referredBy: "Amit Kapoor",
      assignedAdvisor: "Vidushi Kari",
      status: "negotiation",
    },

    propertyIds: ["1", "3"],

    activities: [],
    tasks: [],
    notes: [],
    deals: ["1"],
  },

  {
    id: "2",
    name: "Ananya Mehta",
    phone: "+91 98111 22334",
    email: "ananya@example.com",

    stage: "qualified",

    assignedAdvisor: "Vidushi Kari",

    buyerProfile: {
      nationality: "Indian",
      city: "Bengaluru",
      countryOfResidence: "India",
      occupation: "Doctor",
      preferredCommunication: "call",
    },

    buyerRequirements: {
      budget: {
        min: 35000000,
        max: 45000000,
      },

      preferredLocations: [
        "Dona Paula",
        "Miramar",
      ],

      propertyTypes: ["apartment"],

      bedrooms: 3,

      lookingFor: "ready",

      purpose: "self_use",

      timeline: "immediate",

      financing: "loan",

      seaView: true,

      furnishing: "furnished",
    },

    leadInformation: {
      source: "instagram",
      assignedAdvisor: "Vidushi Kari",
      status: "qualified",
    },

    propertyIds: ["2"],

    activities: [],
    tasks: [],
    notes: [],
    deals: ["3"],
  },

  {
    id: "3",
    name: "Karan Malhotra",
    phone: "+91 98222 33445",
    email: "karan@example.com",

    stage: "viewing",

    assignedAdvisor: "Vidushi Kari",

    buyerProfile: {
      nationality: "Indian",
      city: "Delhi",
      countryOfResidence: "India",
      occupation: "Business Owner",
      preferredCommunication: "whatsapp",
    },

    buyerRequirements: {
      budget: {
        min: 150000000,
        max: 180000000,
      },

      preferredLocations: [
        "Parra",
        "Saligao",
      ],

      propertyTypes: ["villa"],

      bedrooms: 5,

      lookingFor: "ready",

      purpose: "holiday_home",

      timeline: "1_3_months",

      financing: "cash",

      privatePool: true,

      gatedCommunity: false,

      petFriendly: true,

      staffQuarters: true,

      furnishing: "furnished",
    },

    leadInformation: {
      source: "website",
      assignedAdvisor: "Vidushi Kari",
      status: "viewing_scheduled",
    },

    propertyIds: ["1"],

    activities: [],
    tasks: [],
    notes: [],
    deals: ["2"],
  },
]