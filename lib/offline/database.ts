import Dexie, {
  type Table,
} from "dexie"


import type {
  Contact,
} from "@/types/contact"



export interface SyncQueueItem {

  id?: number

  table:
    | "contacts"
    | "activities"
    | "tasks"

  action:
    | "create"
    | "update"
    | "delete"

  recordId:string

  payload:unknown

  createdAt:string

  synced:boolean

}





export class TACDatabase extends Dexie {


  contacts!: Table<
    Contact,
    string
  >


  syncQueue!: Table<
    SyncQueueItem,
    number
  >





  constructor(){

    super(
      "the-address-co"
    )



    this.version(1).stores({

      contacts:
        "id,name,phone,email,stage",

      syncQueue:
        "++id,table,recordId,synced,createdAt",

    })


  }


}



export const db =
  new TACDatabase()