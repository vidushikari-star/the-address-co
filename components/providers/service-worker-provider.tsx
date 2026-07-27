"use client"

import {
  useEffect,
} from "react"



export function ServiceWorkerProvider(){


  useEffect(()=>{


    if(
      "serviceWorker" in navigator
    ){

      navigator.serviceWorker.register(
        "/sw.js"
      )
      .then(()=>{

        console.log(
          "Service worker registered"
        )

      })
      .catch(
        error =>
          console.error(
            "SW registration failed",
            error
          )
      )

    }


  },[])



  return null

}