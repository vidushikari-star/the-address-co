export const CONTACT_TYPES = [
  "Buyer",
  "Seller",
  "Developer",
  "Broker",
  "Investor",
] as const

export type ContactType =
  (typeof CONTACT_TYPES)[number]