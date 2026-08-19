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

  /** Internal ID used only for authenticated "my work" filtering. */
  assignedToId?:string

  amount?:number

  notes?: string

  contactName?: string

propertyName?: string 

  dealName?: string

url?: string

}
