"use client"

import {
  useState,
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
  useRouter,
} from "next/navigation"





type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  deal:any

}





export function CloseDealDrawer({

  open,

  onOpenChange,

  deal,

}:Props){



  const router =
    useRouter()





  const [
    type,
    setType,
  ] = useState<
    "won" | "lost"
  >("won")





  const [
    loading,
    setLoading,
  ] = useState(false)





  const [
    form,
    setForm,
  ] = useState({

    closingPrice:
      String(
        deal.value?.propertyPrice ?? ""
      ),


    commissionType:
      "sale",


    commissionBasis:
      "fixed",


    commissionPercentage:
      "",


    commissionAmount:
      "",


    lostReason:
      "",


    notes:
      "",

  })





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





  async function submit(){


    setLoading(true)



    try{


            if(type === "won"){


        await updateDeal(

          deal.id,

          {

            stage:
              "closed_won",


            value: {

              propertyPrice:
                Number(
                  form.closingPrice || 0
                ),


              commissionPercentage:
                form.commissionPercentage
                  ? Number(
                      form.commissionPercentage
                    )
                  : 0,


              commissionAmount:
                Number(
                  form.commissionAmount || 0
                ),

            },

          }

        )





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
            form.commissionType as "sale" | "rental",


          commissionBasis:
            form.commissionBasis as "fixed" | "percentage",


          commissionPercentage:
            form.commissionPercentage
              ? Number(
                  form.commissionPercentage
                )
              : undefined,


          amount:
            Number(
              form.commissionAmount || 0
            ),


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
            "deal_closed",


          title:
            "Deal Closed Won",


          description:
            deal.name,


          body:
            `Final Value:
₹${Number(
  form.closingPrice
).toLocaleString("en-IN")}

Commission:
₹${Number(
  form.commissionAmount || 0
).toLocaleString("en-IN")}`,



          dealId:
            deal.id,


          contactId:
            deal.contactId,


          propertyId:
            deal.propertyId,


          date:
            new Date().toISOString(),

        })


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
            `Reason:
${form.lostReason || "No reason provided"}

Notes:
${form.notes || "No notes"}`,



          dealId:
            deal.id,


          contactId:
            deal.contactId,


          propertyId:
            deal.propertyId,


          date:
            new Date().toISOString(),

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

          onChange={
            e =>
              setType(
                e.target.value as "won" | "lost"
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
          type === "won" ? (

            <>


              <input

                className="w-full rounded-md border p-2"

                placeholder="Final Sale Price"

                value={
                  form.closingPrice
                }

                onChange={
                  e =>
                    update(
                      "closingPrice",
                      e.target.value
                    )
                }

              />





              <select

                className="w-full rounded-md border p-2"

                value={
                  form.commissionType
                }

                onChange={
                  e =>
                    update(
                      "commissionType",
                      e.target.value
                    )
                }

              >

                <option value="sale">
                  Sale
                </option>

                <option value="rental">
                  Rental
                </option>

              </select>





              <select

                className="w-full rounded-md border p-2"

                value={
                  form.commissionBasis
                }

                onChange={
                  e =>
                    update(
                      "commissionBasis",
                      e.target.value
                    )
                }

              >

                <option value="fixed">
                  Fixed Amount
                </option>

                <option value="percentage">
                  Percentage
                </option>

              </select>





              {
                form.commissionBasis === "percentage" && (

                  <input

                    className="w-full rounded-md border p-2"

                    placeholder="Commission %"

                    value={
                      form.commissionPercentage
                    }

                    onChange={
                      e =>
                        update(
                          "commissionPercentage",
                          e.target.value
                        )
                    }

                  />

                )
              }





              <input

                className="w-full rounded-md border p-2"

                placeholder="Commission Amount"

                value={
                  form.commissionAmount
                }

                onChange={
                  e =>
                    update(
                      "commissionAmount",
                      e.target.value
                    )
                }

              />

            </>


          ) : (

            <>


              <input

                className="w-full rounded-md border p-2"

                placeholder="Lost Reason"

                value={
                  form.lostReason
                }

                onChange={
                  e =>
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

                onChange={
                  e =>
                    update(
                      "notes",
                      e.target.value
                    )
                }

              />


            </>

          )

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
              ? "Saving..."
              : "Close Deal"
          }

        </Button>


      </div>


    </FormDrawer>

  )

}