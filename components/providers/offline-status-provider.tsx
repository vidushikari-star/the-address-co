"use client"

import {
  useEffect,
  useState,
} from "react"



export function OfflineStatusProvider(){

  const [
    online,
    setOnline,
  ] =
  useState(true)



  useEffect(()=>{


    setOnline(
      navigator.onLine
    )



    function handleOnline(){

      setOnline(true)

    }



    function handleOffline(){

      setOnline(false)

    }



    window.addEventListener(
      "online",
      handleOnline
    )


    window.addEventListener(
      "offline",
      handleOffline
    )



    return ()=>{


      window.removeEventListener(
        "online",
        handleOnline
      )


      window.removeEventListener(
        "offline",
        handleOffline
      )


    }


  },[])





  if(online){

    return null

  }





  return (

    <div
      className="
        fixed
        bottom-16
        left-0
        right-0
        z-50
        bg-yellow-500
        px-4
        py-2
        text-center
        text-sm
        font-medium
        text-black
        md:bottom-0
      "
    >

      Offline mode —
      changes will sync automatically

    </div>

  )

}