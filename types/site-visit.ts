export type SiteVisitStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"



export interface SiteVisit {

  id:string

  dealId:string

  contactId:string

  propertyId:string


  contactName?:string

  propertyName?:string

  advisorName?:string


  scheduledDate:string

  scheduledTime:string

  status:SiteVisitStatus

  notes?:string

  buyerFeedback?:string

  advisorId?:string

  createdAt:string

  updatedAt:string

}