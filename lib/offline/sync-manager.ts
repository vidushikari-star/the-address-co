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


    try{


      await syncItem(
        item
      )



      await db.syncQueue.update(
        item.id!,
        {
          synced:true,
        }
      )



    }
    catch(error){


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
          data,
          error,
        } =
          await supabase
            .from("contacts")
            .insert(
              item.payload as Record<string,unknown>
            )
            .select()
            .single()




        if(error){

          throw error

        }






        /*
          Replace temporary offline record
          with real Supabase record
        */


        await db.contacts.delete(
          item.recordId
        )




        await db.contacts.put(
          data
        )



      }



      break






    default:


      console.warn(
        "No sync handler for",
        item.table
      )


  }


}