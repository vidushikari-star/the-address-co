"use client"

import {
  useState,
} from "react"

import {
  FormDrawer,
} from "./form-drawer"

import {
  Input,
} from "@/components/ui/input"

import {
  Button,
} from "@/components/ui/button"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import type {
  Deal,
} from "@/types/deal"



type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  deal:Deal

}





export function EditDealDrawer({
  open,
  onOpenChange,
  deal,
}:Props){


  const [
    loading,
    setLoading,
  ] = useState(false)



  const [
    form,
    setForm,
  ] = useState({

    name:
      deal.name ?? "",


    advisor:
      deal.advisor ?? "",


    advisorId:
      deal.advisorId ?? "",


    price:
      String(
        deal.value?.propertyPrice ?? ""
      ),


    commission:
      String(
        deal.value?.commissionAmount ?? ""
      ),


    probability:
      String(
        deal.probability ?? 0
      ),


    expectedCloseDate:
      deal.expectedCloseDate ?? "",

  })





  function update<K extends keyof typeof form>(
  key: K,
  value: typeof form[K]
) {
  setForm(current => ({
    ...current,
    [key]: value,
  }))
}





  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()

    setLoading(true)



    try {


      





      await updateDeal(

        deal.id,

        {

          name:
            form.name.trim(),


          advisor:
            form.advisor.trim(),


          advisorId:
            form.advisorId ||
            undefined,



          probability:
            Number(
              form.probability
            ),



          expectedCloseDate:
            form.expectedCloseDate ||
            undefined,



          value:{

            propertyPrice:
              Number(
                form.price || 0
              ),



            commissionPercentage:
              deal.value
                ?.commissionPercentage ?? 2,



            commissionAmount:
              Number(
                form.commission || 0
              ),

          },

        }

      )





      



      onOpenChange(false)



      window.location.reload()



    } catch (error: unknown) {


      console.error(
  "FAILED UPDATING DEAL:",
  error
)



      alert(
        "Failed updating deal. Check console."
      )



    } finally {


      setLoading(false)


    }

  }





  return (

    <FormDrawer

      open={open}

      onOpenChange={onOpenChange}

      title="Edit Deal"

      description="Update deal information."

    >

      <form

        onSubmit={submit}

        className="space-y-5"

      >



        <Input

          placeholder="Deal Name"

          value={
            form.name
          }

          onChange={(e)=>
            update(
              "name",
              e.target.value
            )
          }

        />





        <Input

          placeholder="Advisor Name"

          value={
            form.advisor
          }

          onChange={(e)=>
            update(
              "advisor",
              e.target.value
            )
          }

        />





        <Input

          placeholder="Advisor ID"

          value={
            form.advisorId
          }

          onChange={(e)=>
            update(
              "advisorId",
              e.target.value
            )
          }

        />





        <Input

          placeholder="Property Price"

          type="number"

          value={
            form.price
          }

          onChange={(e)=>
            update(
              "price",
              e.target.value
            )
          }

        />





        <Input

          placeholder="Commission Amount"

          type="number"

          value={
            form.commission
          }

          onChange={(e)=>
            update(
              "commission",
              e.target.value
            )
          }

        />





        <Input

          placeholder="Probability %"

          type="number"

          value={
            form.probability
          }

          onChange={(e)=>
            update(
              "probability",
              e.target.value
            )
          }

        />





        <Input

          type="date"

          value={
            form.expectedCloseDate
          }

          onChange={(e)=>
            update(
              "expectedCloseDate",
              e.target.value
            )
          }

        />





        <Button

          type="submit"

          disabled={
            loading
          }

        >

          {
            loading
              ? "Saving..."
              : "Save Changes"
          }

        </Button>



      </form>


    </FormDrawer>

  )

}