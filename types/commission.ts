import type {
  CommissionDistribution,
} from "./commission-distribution"


export type CommissionStatus =
  | "pending"
  | "invoiced"
  | "received"
  | "cancelled"



export type CommissionType =
  | "sale"
  | "rental"



export type CommissionBasis =
  | "percentage"
  | "fixed"





export interface Commission {


  id: string


  dealId: string


  contactId?: string


  propertyId?: string





  advisorId?: string


  advisorName?: string


  dealName?: string





  type: CommissionType


  commissionBasis?: CommissionBasis


  commissionPercentage?: number





  amount: number


  status: CommissionStatus





  dueDate?: string


  receivedDate?: string





  invoiceNumber?: string


  invoiceDate?: string





  paymentReference?: string


  paymentMode?: string


  paymentDate?: string





  notes?: string





  createdAt: string


  updatedAt: string



  distributions?: CommissionDistribution[]


}