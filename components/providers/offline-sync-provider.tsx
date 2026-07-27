"use client"

import {
  useEffect,
} from "react"

import {
  registerNetworkListener,
} from "@/lib/offline/network"



export function OfflineSyncProvider(){

  useEffect(()=>{


    const cleanup =
      registerNetworkListener()



    return () => {

      cleanup?.()

    }


  },[])



  return null

}