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



export interface CommissionDistribution {

  id:string

  commissionId:string

  userId:string

  userName?:string

  role:CommissionDistributionRole

  percentage?:number

  amount:number

  status:CommissionDistributionStatus

  paidDate?:string

  notes?:string

  createdAt:string

}