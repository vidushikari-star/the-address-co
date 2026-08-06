export type CalendarItemType =
  | "task"
  | "site_visit"
  | "activity"
  | "commission"



export interface CalendarItem {

  id:string

  title:string

  date:string

  time?:string

  type:CalendarItemType

  status?:string

  contactId?:string

  dealId?:string

  propertyId?:string

  assignedTo?:string

  amount?:number

  contactName?: string

propertyName?: string 

  dealName?: string

url?: string

}