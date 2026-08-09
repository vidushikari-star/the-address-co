"use client"

import {
  useState,
} from "react"

import Link from "next/link"

import type {
  Commission,
} from "@/types/commission"

import type {
  Deal,
} from "@/types/deal"

import {
  Button,
} from "@/components/ui/button"

import {
  markCommissionReceived,
} from "@/lib/repositories/commission-repository"


import {
  formatCommissionRole,
} from "@/lib/utils/format-commission-role"

import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import {
  DealCommissionBreakdown,
} from "@/components/deals/deal-commission-breakdown"





type Props = {

  deal: Deal

  commissions: Commission[]

  propertySources?: PropertySource[]

  role?: "admin" | "sales"

  paidDistributionAmount?: number

}





function formatDate(
  date?:string
){

  if(!date){

    return "-"

  }


  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}










export function DealCommission({

  commissions,

  deal,

  propertySources = [],

  role,

}: Props) {



  const [
    loadingId,
    setLoadingId,
  ] = useState<string | null>(
    null
  )



 









  if(!commissions.length){

    return (

      <div className="rounded-2xl border p-6">

        <h2 className="font-semibold">
          Expected Commission
        </h2>

        <div className="mt-4">

          <DealCommissionBreakdown
            deal={deal}
            propertySources={propertySources}
            showPropertyValue={true}
          />

        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Final commission records are created when the deal is closed.
        </p>

      </div>

    )

  }









  async function markReceived(
    id:string
  ){

    setLoadingId(id)


    try {

      await markCommissionReceived(
        id
      )


      window.location.reload()


    } finally {

      setLoadingId(null)

    }

  }









  return (

    <div className="rounded-2xl border p-6 space-y-4">


      <h2 className="font-semibold">
        Commission
      </h2>





      {
        commissions.map(
          commission => (

            <div

              key={
                commission.id
              }

              className="rounded-xl border p-4 space-y-4"

            >

            <div className="text-lg font-semibold">

  {
    formatCommissionRole(
      commission.commissionRole
    )
  }

</div>





              <div className="flex justify-between">

                <span className="text-sm text-muted-foreground">
                  Type
                </span>

                <span className="font-medium capitalize">
                  {formatCommissionRole(
  commission.commissionRole
)}
                </span>

              </div>







              <div className="flex justify-between">

                <span className="text-sm text-muted-foreground">
                  Amount
                </span>

                <span className="font-semibold">

                  ₹
                  {commission.amount.toLocaleString(
                    "en-IN"
                  )}

                </span>

              </div>







              <div className="flex justify-between">

                <span className="text-sm text-muted-foreground">
                  Advisor
                </span>

                <span className="font-medium">

                  {
                    commission.advisorName ??
                    "Unassigned"
                  }

                </span>

              </div>







              <div className="flex justify-between">

                <span className="text-sm text-muted-foreground">
                  Status
                </span>

                <span className="capitalize">

                  {
                    commission.status
                  }

                </span>

              </div>







              {
                commission.invoiceNumber && (

                  <div className="flex justify-between">

                    <span className="text-sm text-muted-foreground">
                      Invoice
                    </span>

                    <span>

                      {
                        commission.invoiceNumber
                      }

                    </span>

                  </div>

                )
              }







              {
                commission.paymentMode && (

                  <div className="flex justify-between">

                    <span className="text-sm text-muted-foreground">
                      Payment Mode
                    </span>

                    <span>

                      {
                        commission.paymentMode
                      }

                    </span>

                  </div>

                )
              }







              {
                commission.paymentDate && (

                  <div className="flex justify-between">

                    <span className="text-sm text-muted-foreground">
                      Payment Date
                    </span>

                    <span>

                      {
                        formatDate(
                          commission.paymentDate
                        )
                      }

                    </span>

                  </div>

                )
              }









              <div className="flex flex-wrap gap-3 pt-2">





                <Link

                  href={
                    `/commissions/${commission.id}`
                  }

                >

                  <Button
                    variant="outline"
                    size="sm"
                  >

                    View Details

                  </Button>

                </Link>







                







                {
                  role === "admin" &&
                  commission.status !== "received" && (

                    <Button

                      size="sm"

                      onClick={() =>
                        markReceived(
                          commission.id
                        )
                      }

                      disabled={
                        loadingId === commission.id
                      }

                    >

                      {
                        loadingId === commission.id
                          ? "Updating..."
                          : "Mark Received"
                      }

                    </Button>

                  )

                }


              </div>







              





            </div>

          )

        )

      }


    </div>

  )

}
