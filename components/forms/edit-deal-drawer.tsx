"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

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

import {
  getActiveAssignableUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import type {
  Deal,
} from "@/types/deal"

import type {
  UserProfile,
} from "@/types/user"



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

  const router =
    useRouter()


  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    advisors,
    setAdvisors,
  ] = useState<UserProfile[]>([])



  const isRental =
    deal.value?.commissionType === "rental"




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


    commissionPercentage:
      String(
        deal.value?.commissionPercentage ?? 2
      ),


    commissionAmount:
      String(
        deal.value?.commissionAmount ?? 0
      ),


    probability:
      String(
        deal.probability ?? 0
      ),


    expectedCloseDate:
      deal.expectedCloseDate ?? "",

  })

  useEffect(() => {
    if (!open) return

    getActiveAssignableUserProfiles()
      .then(setAdvisors)
      .catch((loadError) => {
        console.error("Unable to load active CRM advisors", loadError)
        setError("Unable to load advisors. Please try again.")
      })
  }, [open])





  function update<K extends keyof typeof form>(
    key:K,
    value:typeof form[K]
  ){

    setForm(
      current => ({
        ...current,
        [key]:
          value,
      })
    )

  }

  function selectAdvisor(advisorId: string) {
    const advisor = advisors.find((item) => item.id === advisorId)
    setForm((current) => ({
      ...current,
      advisorId,
      advisor: advisor?.name ?? current.advisor,
    }))
  }





  const commissionAmount =

    isRental

      ?

        Number(
          form.commissionAmount || 0
        )

      :

        (
          Number(
            form.price || 0
          )
          *
          Number(
            form.commissionPercentage || 0
          )
          /
          100
        )







  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()

    if(
      !form.name.trim() ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      !Number.isFinite(Number(form.probability)) ||
      Number(form.probability) < 0 ||
      Number(form.probability) > 100 ||
      (
        isRental &&
        (
          !Number.isFinite(Number(form.commissionAmount)) ||
          Number(form.commissionAmount) < 0
        )
      ) ||
      (
        !isRental &&
        (
          !Number.isFinite(Number(form.commissionPercentage)) ||
          Number(form.commissionPercentage) < 0
        )
      )
    ){

      setError(
        "Enter a deal name, valid value, and probability between 0 and 100."
      )

      return

    }

    setLoading(true)
    setError(null)



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

            commissionType:
              deal.value?.commissionType ??
              "sale",

            commissionBasis:
              deal.value?.commissionBasis ??
              "percentage",

            commissionPercentage:
              Number(
                form.commissionPercentage || 0
              ),

            commissionAmount,

          },

        }

      )



      onOpenChange(false)


      router.refresh()



    } catch(error){


      console.error(
        "FAILED UPDATING DEAL:",
        error
      )


      setError("Unable to save the deal. Please try again.")


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

          required

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



        <label className="space-y-2">
          <span className="text-sm font-medium">Assigned CRM advisor</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={form.advisorId}
            onChange={(event) => selectAdvisor(event.target.value)}
          >
            <option value="">Unassigned</option>
            {form.advisorId && !advisors.some((advisor) => advisor.id === form.advisorId) && (
              <option value={form.advisorId} disabled>
                Historical advisor (no longer active)
              </option>
            )}
            {advisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name}
              </option>
            ))}
          </select>
        </label>



        <Input

          placeholder={
            isRental
              ? "Monthly Rent"
              : "Property Price"
          }

          type="number"

          min="0.01"

          step="0.01"

          value={
            form.price
          }

          onChange={(e)=>
            update(
              "price",
              e.target.value
            )
          }

          required

        />




        {
          !isRental && (

            <Input

              placeholder="Commission Percentage"

              type="number"

              min="0"

              step="0.01"

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

          )
        }

        {
          isRental && (

            <Input

              placeholder="Expected Commission"

              type="number"

              min="0"

              step="0.01"

              value={
                form.commissionAmount
              }

              onChange={(e)=>
                update(
                  "commissionAmount",
                  e.target.value
                )
              }

            />

          )
        }




        <div className="
          rounded-xl
          bg-muted
          p-3
          text-sm
        ">

          Commission Amount:

          {" "}

          ₹
          {commissionAmount.toLocaleString(
            "en-IN"
          )}

        </div>





        <Input

          placeholder="Probability %"

          type="number"

          min="0"

          max="100"

          step="1"

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

          type="submit"

          disabled={
            loading
          }

          className="w-full sm:w-auto"

        >

          {
            loading
              ? "Saving..."
              : "Save Changes"
          }

        </Button>
        </div>


      </form>

    </FormDrawer>

  )

}
