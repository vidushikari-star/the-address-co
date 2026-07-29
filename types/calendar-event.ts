export type CalendarEventType =
  | "meeting"
  | "site_visit"
  | "follow_up"
  | "task"
  | "other"



export type CalendarEventStatus =
  | "scheduled"
  | "completed"
  | "cancelled"





export interface CalendarEvent {

  id:string


  title:string

  description?:string


  eventType:CalendarEventType


  startTime:string

  endTime?:string



  assignedTo?:string

  createdBy:string



  contactId?:string

  propertyId?:string

  dealId?:string



  status:CalendarEventStatus



  createdAt:string

  updatedAt:string

}