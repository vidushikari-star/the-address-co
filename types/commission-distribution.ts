export type CommissionDistributionStatus =
  | "pending"
  | "paid"


export type CommissionDistributionRole =
  | "partner"
  | "sales"
  | "client_source"
  | "inventory_source"
  | "client_inventory"
  | "other"

export type CommissionDistributionRecipientKind =
  | "crm_user"
  | "external"



export interface CommissionDistribution {

  id:string

  commissionId:string

  /** Present only for an internal CRM recipient. */
  userId?:string

  /** Present only for an external financial counterparty. */
  externalRecipientId?:string

  recipientKind:CommissionDistributionRecipientKind

  userName?:string

  recipientName?:string

  recipientIsActive?:boolean

  dealName?:string

  commissionAmount?:number

  role:CommissionDistributionRole

  percentage?:number

  amount:number

  status:CommissionDistributionStatus

  paidDate?:string

  notes?:string

  createdAt:string


}
