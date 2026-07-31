"use client"

import {
  useState,
  useEffect,
} from "react"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  createCommission,
} from "@/lib/repositories/commission-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  getPropertyById,
} from "@/lib/repositories/property-repository"

import {
  useRouter,
} from "next/navigation"

import type {
  Deal,
} from "@/types/deal"



type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  deal:Deal

}






export function CloseDealDrawer({

  open,

  onOpenChange,

  deal,

}:Props){



  const router =
    useRouter()





  const [
    property,
    setProperty,
  ] =
  useState<any>(null)





  useEffect(()=>{


    async function loadProperty(){


      if(!deal.propertyId){

        return

      }


      const data =
        await getPropertyById(
          deal.propertyId
        )


      setProperty(
        data
      )


    }


    if(open){

      loadProperty()

    }


  },[
    open,
    deal.propertyId
  ])






  const isRental =
    property?.transactionType === "Rental"






  const [
    type,
    setType,
  ] =
  useState<
    "won" | "lost"
  >(
    "won"
  )






  const [
    loading,
    setLoading,
  ] =
  useState(false)






  const [
    form,
    setForm,
  ] =
  useState({

    closingPrice:
      String(
        deal.value?.propertyPrice ?? ""
      ),



    commissionType:
      isRental
        ? "rental"
        : "sale",



    commissionBasis:
      isRental
        ? "fixed"
        : "percentage",



    commissionPercentage:
      isRental
        ? ""
        : "2",



    commissionAmount:
      isRental
        ? String(
            property?.price?.rent ?? ""
          )
        :
          String(
            (
              Number(
                deal.value?.propertyPrice ?? 0
              )
              *
              2
              /
              100
            )
          ),



    lostReason:
      "",



    notes:
      "",

  })






  useEffect(()=>{


    if(!property){

      return

    }



    setForm(
      current => ({

        ...current,


        commissionType:
          property.transactionType === "Rental"
            ? "rental"
            : "sale",



        commissionBasis:
          property.transactionType === "Rental"
            ? "fixed"
            : "percentage",



        commissionPercentage:
          property.transactionType === "Rental"
            ? ""
            : "2",



        commissionAmount:
          property.transactionType === "Rental"
            ?
              String(
                property.price?.rent ?? ""
              )
            :
              String(
                (
                  Number(
                    current.closingPrice || 0
                  )
                  *
                  2
                  /
                  100
                )
              ),

      })
    )


  },[property])







  function update(

    key:string,

    value:string

  ){


    setForm(

      current => ({

        ...current,

        [key]:
          value,

      })

    )


  }








  function calculateCommission(){


    if(
      form.commissionBasis === "percentage"
    ){

      return (

        Number(
          form.closingPrice || 0
        )
        *
        Number(
          form.commissionPercentage || 0
        )
        /
        100

      )

    }



    return Number(
      form.commissionAmount || 0
    )


  }
    async function submit(){


    setLoading(true)



    try {


      if(type === "won"){


        const finalCommission =
          calculateCommission()



        await updateDeal(

          deal.id,

          {

            stage:
              "closed_won",



            value:{

  propertyPrice:
    Number(
      form.closingPrice || 0
    ),


  commissionType:
    form.commissionType as
      | "sale"
      | "rental",


  commissionBasis:
    form.commissionBasis as
      | "fixed"
      | "percentage",


  commissionPercentage:
    form.commissionBasis === "percentage"
      ?
        Number(
          form.commissionPercentage || 0
        )
      :
        0,


  commissionAmount:
    finalCommission,

},

          }

        )







        const commission =

          await createCommission({

            dealId:
              deal.id,



            contactId:
              deal.contactId,



            propertyId:
              deal.propertyId,



            advisorId:
              deal.advisorId,



            type:
              form.commissionType as
                | "sale"
                | "rental",



            commissionBasis:
              form.commissionBasis as
                | "fixed"
                | "percentage",



            commissionPercentage:
              form.commissionBasis === "percentage"
                ?
                  Number(
                    form.commissionPercentage || 0
                  )
                :
                  undefined,



            amount:
              finalCommission,



            status:
              "pending",



            dueDate:
              new Date(
                Date.now()
                +
                30 *
                24 *
                60 *
                60 *
                1000
              )
              .toISOString()
              .split("T")[0],



            notes:
              "Created from Closed Won deal",

          })

await createActivity({

  type:
    "commission",


  title:
    "Commission Created",


  description:
    deal.name,


  body:
`
Expected Commission:
₹${finalCommission.toLocaleString("en-IN")}
`,


  dealId:
    deal.id,


  contactId:
    deal.contactId,


  propertyId:
    deal.propertyId,


  date:
    new Date().toISOString(),

})





        await createActivity({

          type:
            "deal_closed",



          title:
            "Deal Closed Won",



          description:
            deal.name,



          body:
`
Final Value:
₹${Number(
  form.closingPrice
).toLocaleString("en-IN")}

Commission:
₹${finalCommission.toLocaleString("en-IN")}
`,



          dealId:
            deal.id,



          contactId:
            deal.contactId,



          propertyId:
            deal.propertyId,



          date:
            new Date()
            .toISOString(),

        })







        onOpenChange(false)



        router.push(
          `/commissions/${commission.id}`
        )



        router.refresh()



      } else {



        await updateDeal(

          deal.id,

          {

            stage:
              "closed_lost",

          }

        )





        await createActivity({

          type:
            "deal_closed",



          title:
            "Deal Closed Lost",



          description:
            deal.name,



          body:
`
Reason:
${form.lostReason || "No reason provided"}

Notes:
${form.notes || "No notes"}
`,



          dealId:
            deal.id,



          contactId:
            deal.contactId,



          propertyId:
            deal.propertyId,



          date:
            new Date()
            .toISOString(),

        })


      }




      onOpenChange(false)


      router.refresh()



    } catch(error){


      console.error(
        "Failed closing deal",
        error
      )



      alert(
        "Failed closing deal"
      )



    } finally {


      setLoading(false)


    }


  }







  return (

    <FormDrawer

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title="Close Deal"

      description="Mark this deal as won or lost."

    >


      <div className="space-y-5">



        <select

          className="w-full rounded-md border p-2"

          value={
            type
          }

          onChange={(e)=>
            setType(
              e.target.value as
                | "won"
                | "lost"
            )
          }

        >

          <option value="won">
            Closed Won
          </option>


          <option value="lost">
            Closed Lost
          </option>


        </select>







        {
          type === "won"
          ?

          <>


            <input

              className="w-full rounded-md border p-2"

              placeholder={
                isRental
                  ? "Monthly Rent"
                  : "Final Sale Price"
              }

              value={
                form.closingPrice
              }

              onChange={(e)=>
                update(
                  "closingPrice",
                  e.target.value
                )
              }

            />







            <div className="rounded-md bg-muted p-3 text-sm">

              Transaction Type:

              {" "}

              {
                isRental
                  ? "Rental"
                  : "Sale"
              }

            </div>







            <select

              className="w-full rounded-md border p-2"

              value={
                form.commissionBasis
              }

              onChange={(e)=>
                update(
                  "commissionBasis",
                  e.target.value
                )
              }

            >

              <option value="percentage">
                Percentage
              </option>


              <option value="fixed">
                Fixed Amount
              </option>


            </select>







            {
              form.commissionBasis === "percentage"
              &&

              <input

                className="w-full rounded-md border p-2"

                placeholder="Commission %"

                value={
                  form.commissionPercentage
                }

                onChange={(e)=>
                  update(
                    "commissionPercentage",
                    e.target.value
                  )
                }

              />

            }







            <div className="rounded-xl bg-muted p-4">

              Expected Commission:

              {" "}

              ₹
              {
                calculateCommission()
                .toLocaleString(
                  "en-IN"
                )
              }


            </div>


          </>

          :

          <>

            <input

              className="w-full rounded-md border p-2"

              placeholder="Lost Reason"

              value={
                form.lostReason
              }

              onChange={(e)=>
                update(
                  "lostReason",
                  e.target.value
                )
              }

            />




            <textarea

              className="w-full rounded-md border p-2"

              placeholder="Notes"

              value={
                form.notes
              }

              onChange={(e)=>
                update(
                  "notes",
                  e.target.value
                )
              }

            />


          </>

        }







        <Button

          onClick={
            submit
          }

          disabled={
            loading
          }

          className="w-full"

        >

          {
            loading
            ?
              "Saving..."
            :
              "Close Deal"
          }


        </Button>



      </div>


    </FormDrawer>


  )

}