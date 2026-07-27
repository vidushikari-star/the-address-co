import {
  processSyncQueue,
} from "@/lib/offline/sync-manager"



export function registerNetworkListener(){

  if(
    typeof window === "undefined"
  ){

    return

  }



  async function syncWhenOnline(){

    if(
      navigator.onLine
    ){

      console.log(
        "Network restored. Syncing..."
      )


      await processSyncQueue()

    }

  }





  window.addEventListener(
    "online",
    syncWhenOnline
  )



  // Initial check

  syncWhenOnline()



  return () => {


    window.removeEventListener(
      "online",
      syncWhenOnline
    )


  }


}