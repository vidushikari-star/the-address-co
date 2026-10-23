export type CommissionRecipientType =
  | "broker"
  | "co_broker"
  | "referral_partner"
  | "channel_partner"
  | "consultant"
  | "other"

export interface CommissionRecipient {
  id: string
  name: string
  recipientType: CommissionRecipientType
  companyName?: string
  phone?: string
  email?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
