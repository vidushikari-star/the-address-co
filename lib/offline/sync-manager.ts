import {
  db,
  type SyncQueueItem,
} from "@/lib/offline/database"

import {
  supabase,
} from "@/lib/supabase/client"





export async function processSyncQueue(){

  const pendingItems =
    await db.syncQueue
      .where("synced")
      .equals(0)
      .toArray()



  if(
    pendingItems.length === 0
  ){

    return

  }





  for(
    const item of pendingItems
  ){

    try {


      await syncItem(
        item
      )



      await db.syncQueue.update(
        item.id!,
        {
          synced:true,
        }
      )


    } catch(error){


      console.error(
        "Sync failed",
        item,
        error
      )


    }


  }


}







async function syncItem(
  item:SyncQueueItem
){

  switch(
    item.table
  ){



    case "contacts":


      if(
        item.action === "create"
      ){

        const {
          error,
        } =
          await supabase
            .from("contacts")
            .insert(
              item.payload as Record<string, unknown>
            )



        if(error){

          throw error

        }


      }





      if(
        item.action === "update"
      ){

        const {
          error,
        } =
          await supabase
            .from("contacts")
            .update(
              item.payload as Record<string, unknown>
            )
            .eq(
              "id",
              item.recordId
            )



        if(error){

          throw error

        }

      }




      if(
        item.action === "delete"
      ){

        const {
          error,
        } =
          await supabase
            .from("contacts")
            .delete()
            .eq(
              "id",
              item.recordId
            )



        if(error){

          throw error

        }

      }



      break




    default:

      console.warn(
        "No sync handler for",
        item.table
      )

  }

}