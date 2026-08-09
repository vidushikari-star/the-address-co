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
  getPropertySources,
} from "@/lib/repositories/property-contact-repository"

import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import {
  calculateDealCommissions,
} from "@/lib/utils/calculate-deal-commissions"

import {
  useRouter,
} from "next/navigation"

import type {
  Deal,
} from "@/types/deal"

import type {
  Property,
} from "@/types/property"





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
  useState<Property | null>(null)





  const [
    propertySources,
    setPropertySources,
  ] =
  useState<PropertySource[]>([])







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
        data ?? null
      )



      const sources =
        await getPropertySources(
          deal.propertyId
        )


      setPropertySources(
        sources
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
    error,
    setError,
  ] =
  useState<string | null>(null)








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
      deal.value?.commissionType ?? "sale",



    commissionBasis:
      deal.value?.commissionBasis ?? "percentage",



    commissionPercentage:
      String(
        deal.value?.commissionPercentage ?? 2
      ),



    commissionAmount:
      String(
        deal.value?.commissionAmount ?? 0
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
          deal.value?.commissionBasis
          ??
          (
            property.transactionType === "Rental"
              ? "fixed"
              : "percentage"
          ),



        commissionPercentage:
          String(
            deal.value?.commissionPercentage
            ??
            (
              property.transactionType === "Rental"
                ? 0
                : property.price?.commission ?? 2
            )
          ),



        commissionAmount:
          String(
            deal.value?.commissionAmount
            ??
            (
              property.transactionType === "Rental"
                ? property.price?.rent ?? 0
                :
                (
                  Number(
                    current.closingPrice || 0
                  )
                  *
                  (
                    property.price?.commission ?? 2
                  )
                  /
                  100
                )
            )
          ),


      })
    )


  },[
    property,
    deal.value?.commissionBasis,
    deal.value?.commissionPercentage,
    deal.value?.commissionAmount
  ])







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


    const baseAmount =

      property?.transactionType === "Rental"

        ?

        Number(
          property?.price?.rent ?? 0
        )

        :

        Number(
          form.closingPrice || 0
        )





    if(
      form.commissionBasis === "percentage"
    ){


      return (

        baseAmount *

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

    if(
      type === "won" &&
      (
        !Number.isFinite(Number(form.closingPrice)) ||
        Number(form.closingPrice) <= 0
      )
    ){

      setError("Enter the final sale value before closing this deal as won.")

      return

    }

    if(
      type === "lost" &&
      !form.lostReason.trim()
    ){

      setError("Add a loss reason so it can be reported accurately.")

      return

    }


    setLoading(true)
    setError(null)


    try {


      const finalCommission =
        calculateCommission()

              if(type === "won"){



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

            }

          }

        )






        const dealWithCommission = {

  ...deal,

  value:{

    ...deal.value,


    commissionType:
      form.commissionType as
      | "sale"
      | "rental",


    commissionBasis:
      form.commissionBasis as
      | "percentage"
      | "fixed",


    commissionPercentage:
      Number(
        form.commissionPercentage || 0
      ),


    commissionAmount:
      finalCommission,

  }

}



const calculatedCommissions =

  calculateDealCommissions({

    deal:
      dealWithCommission,


    propertySources,


    closingPrice:
      Number(
        form.closingPrice || 0
      ),

  })






        for(
          const commission of calculatedCommissions
        ){

          await createCommission(
            commission
          )

        }







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
            new Date()
            .toISOString(),

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
          `/deals/${deal.id}`
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



      setError("Unable to close the deal. Please try again.")



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

              type="number"

              min="0.01"

              step="0.01"

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

                type="number"

                min="0"

                step="0.01"


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






            {
              propertySources.length > 0 && (

                <div className="
                  rounded-xl
                  border
                  p-4
                  space-y-3
                ">

                  <h3 className="font-semibold">
                    Property Commission Agreements
                  </h3>


                  {
                    propertySources.map(

                      source => (

                        <div

                          key={
                            source.id
                          }

                          className="
                            flex
                            justify-between
                            text-sm
                          "

                        >

                          <span>

                            {
                              source.relationshipType
                            }

                          </span>


                          <span>

                            {
                              source.commission?.percentage
                              ??
                              "-"
                            }%

                          </span>


                        </div>

                      )

                    )

                  }


                </div>

              )
            }


          </>


          :

          <>


            <input

              className="w-full rounded-md border p-2"

              required


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




        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button

          type="button"

          variant="outline"

          disabled={loading}

          onClick={() => onOpenChange(false)}

        >

          Cancel

        </Button>

        <Button

          onClick={
            submit
          }


          disabled={
            loading
          }


          className="w-full sm:w-auto"

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



      </div>


    </FormDrawer>

  )


}
