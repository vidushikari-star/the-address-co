"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

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

  const [
    error,
    setError,
  ] =
  useState<string | null>(null)

  const router = useRouter()



  async function sync(){


    setLoading(true)
    setError(null)


    try{

      const result = await runHousingSync()

      if (!result) {
        throw new Error("Housing returned no sync result.")
      }

      router.refresh()
    }
    catch(error){

      setError(
        error instanceof Error
          ? error.message
          : "Unable to sync Housing leads. Please try again."
      )

    }
    finally{

      setLoading(false)

    }

  }





  return (

    <div className="w-full sm:w-auto">
      <Button

      onClick={sync}

      disabled={loading}

      className="w-full sm:w-auto"

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

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>

  )

}
