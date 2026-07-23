"use client"

import {
  useState,
} from "react"

import type {
  Commission,
} from "@/types/commission"

import {
  CommissionTable,
} from "@/components/finance/commission-table"





type Props = {

  commissions: Commission[]

  role?: string

}







export function CommissionFilters({

  commissions,

  role,

}: Props) {



  const [
    status,
    setStatus,
  ] = useState(
    "all"
  )



  const [
    type,
    setType,
  ] = useState(
    "all"
  )







  const filteredCommissions =
    commissions.filter(
      commission => {


        const statusMatch =
          status === "all" ||
          commission.status === status





        const typeMatch =
          type === "all" ||
          commission.type === type





        return (
          statusMatch &&
          typeMatch
        )

      }
    )









  return (

    <div className="space-y-6">





      <div className="flex flex-wrap gap-4">





        <div>

          <label className="mb-2 block text-sm text-muted-foreground">

            Status

          </label>


          <select

            value={
              status
            }

            onChange={
              e =>
                setStatus(
                  e.target.value
                )
            }

            className="rounded-md border bg-background px-3 py-2 text-sm"

          >

            <option value="all">
              All
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="invoiced">
              Invoiced
            </option>

            <option value="received">
              Received
            </option>

            <option value="cancelled">
              Cancelled
            </option>


          </select>

        </div>









        <div>

          <label className="mb-2 block text-sm text-muted-foreground">

            Type

          </label>


          <select

            value={
              type
            }

            onChange={
              e =>
                setType(
                  e.target.value
                )
            }

            className="rounded-md border bg-background px-3 py-2 text-sm"

          >

            <option value="all">
              All
            </option>


            <option value="sale">
              Sale
            </option>


            <option value="rental">
              Rental
            </option>


          </select>


        </div>




      </div>









      <CommissionTable

        commissions={
          filteredCommissions
        }

        role={
          role
        }

      />





    </div>

  )

}