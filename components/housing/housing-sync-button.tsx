"use client"

import {
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"

import {
  RefreshCw,
} from "lucide-react"

import {
  runHousingSync,
} from "@/lib/integrations/housing/housing/housing-sync-action"



export function HousingSyncButton(){


  const [
    loading,
    setLoading,
  ] =
  useState(false)



  async function sync(){


    setLoading(true)


    try{

      await runHousingSync()

      window.location.reload()

    }
    finally{

      setLoading(false)

    }

  }





  return (

    <Button

      onClick={sync}

      disabled={loading}

    >

      <RefreshCw
        className={`
          mr-2
          h-4
          w-4
          ${loading ? "animate-spin" : ""}
        `}
      />

      {
        loading
          ? "Syncing..."
          : "Sync Housing Leads"
      }

    </Button>

  )

}