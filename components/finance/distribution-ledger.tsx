"use client"

import {
  useState,
} from "react"

import {
  AddDistributionDrawer,
} from "@/components/finance/add-distribution-drawer"

import type {
  CommissionDistribution,
} from "@/types/commission-distribution"


import type {
  Commission,
} from "@/types/commission"



type Props = {

  distributions: CommissionDistribution[]

  commissions: Commission[]

}





function money(
 value:number
){

 return `₹${value.toLocaleString("en-IN")}`

}






export function DistributionLedger({

 distributions,

 commissions,

}:Props){


 const [
  open,
  setOpen,
 ] =
 useState(false)





 return (

  <div className="rounded-2xl border p-6 space-y-5">



   <div className="flex items-center justify-between">


    <div>

     <h2 className="text-xl font-semibold">
      Commission Distribution Ledger
     </h2>


     <p className="text-sm text-muted-foreground">
      Track internal commission splits.
     </p>

    </div>



    <button

      onClick={() => setOpen(true)}

      className="rounded-md bg-primary px-4 py-2 text-sm text-white"

    >

      + Add Distribution

    </button>


   </div>







   {
    distributions.length === 0 ? (

     <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">

      No commission splits recorded.

     </div>

    ) : (


    <div className="rounded-xl border overflow-hidden">


     <table className="w-full text-sm">


      <thead className="bg-muted">

       <tr>

        <th className="p-4 text-left">
         Deal
        </th>


        <th className="p-4 text-left">
         Person
        </th>


        <th className="p-4 text-left">
         Role
        </th>


        <th className="p-4 text-left">
         Amount
        </th>


        <th className="p-4 text-left">
         Status
        </th>


       </tr>

      </thead>



      <tbody>


      {
       distributions.map(
        item => (

         <tr
          key={item.id}
          className="border-t"
         >

          <td className="p-4">
           {item.dealName ?? "-"}
          </td>


          <td className="p-4 font-medium">
           {item.userName ?? "-"}
          </td>


          <td className="p-4 capitalize">
           {item.role.replace("_"," ")}
          </td>


          <td className="p-4 font-semibold">
           {money(item.amount)}
          </td>


          <td className="p-4 capitalize">
           {item.status}
          </td>


         </tr>

        )
       )
      }


      </tbody>


     </table>


    </div>


    )

   }







   <AddDistributionDrawer

    open={
      open
    }

    onOpenChange={
      setOpen
    }

    commissions={
      commissions
    }

   />


  </div>

 )

}