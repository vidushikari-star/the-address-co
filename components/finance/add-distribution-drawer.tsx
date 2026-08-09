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
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  supabase,
} from "@/lib/supabase/client"

import {
  createCommissionDistribution,
  deleteCommissionDistributionGroup,
} from "@/lib/repositories/commission-distribution-repository"

import type {
  Commission,
} from "@/types/commission"

import type {
  CommissionDistributionRole,
  CommissionDistribution,
} from "@/types/commission-distribution"





type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  commissions:Commission[]

  editingCommissionId?:string

  editingDistributions?:CommissionDistribution[]

}





type Split = {

  userId:string

  role:CommissionDistributionRole

  amount:string

}





const emptySplit:Split = {

  userId:"",

  role:"partner",

  amount:"",

}







export function AddDistributionDrawer({

  open,

  onOpenChange,

  commissions,

  editingCommissionId,

  editingDistributions,

}:Props){



  const router =
    useRouter()





  const isEditing =
    Boolean(
      editingCommissionId
    )





  type UserOption = {
  id: string
  name: string
}

const [
  users,
  setUsers,
] =
useState<UserOption[]>([])



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
    commissionId,
    setCommissionId,
  ] =
  useState("")





  const [
    splits,
    setSplits,
  ] =
  useState<Split[]>([
    {...emptySplit},
    {...emptySplit},
    {...emptySplit},
  ])







  useEffect(()=>{


    async function loadUsers(){


      const {
        data,
      } =
      await supabase
        .from("user_profiles")
        .select(
          "id,name"
        )
        .order(
          "name"
        )


      setUsers(
        data ?? []
      )

    }


    if(open){

      loadUsers()


      if(
        editingCommissionId &&
        editingDistributions
      ){

        setCommissionId(
          editingCommissionId
        )


        setSplits(

          editingDistributions
          .slice(0,3)
          .map(
            item => ({

              userId:
                item.userId,

              role:
                item.role,

              amount:
                String(
                  item.amount
                ),

            })
          )
          .concat(
            [
              ...Array(
                Math.max(
                  0,
                  3 -
                  editingDistributions.length
                )
              )
            ]
            .map(
              () => ({
                ...emptySplit
              })
            )
          )

        )

      }


    }


  },[
    open,
    editingCommissionId,
    editingDistributions,
  ])







  const selectedCommission =
    commissions.find(
      item =>
        item.id === commissionId
    )





  const totalCommission =
    selectedCommission?.amount ?? 0





  const allocated =
    splits.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    )





  const remaining =
    totalCommission -
    allocated

  const activeSplits =
    splits.filter(
      split =>
        split.userId &&
        Number(split.amount) > 0
    )

  const hasIncompleteSplit =
    splits.some(
      split =>
        Boolean(split.userId) !==
        Boolean(split.amount)
    )

  const hasDuplicateRecipients =
    new Set(
      activeSplits.map(
        split => split.userId
      )
    ).size !== activeSplits.length





  function updateSplit(
    index:number,
    key:keyof Split,
    value:string
  ){

    setSplits(
      current =>
        current.map(
          (
            item,
            i
          ) =>
            i === index
              ? {
                  ...item,
                  [key]:
                    value,
                }
              : item
        )
    )

  }







  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()



    if(
      !selectedCommission
    ){

      setError("Select the commission to distribute.")

      return

    }

    if(
      activeSplits.length === 0 ||
      hasIncompleteSplit
    ){

      setError("Add at least one recipient and a positive amount for every split.")

      return

    }

    if(
      hasDuplicateRecipients
    ){

      setError("Each recipient can appear only once in a commission split.")

      return

    }





    if(
      allocated >
      totalCommission
    ){

      setError("The split total cannot exceed the commission amount.")

      return

    }





    setLoading(true)
    setError(null)



    try{


      if(
        isEditing &&
        editingCommissionId
      ){

        await deleteCommissionDistributionGroup(
          editingCommissionId
        )

      }





      for(
        const split of splits
      ){

        if(
          split.userId &&
          Number(split.amount) > 0
        ){

          await createCommissionDistribution({

            commissionId,

            userId:
              split.userId,


            role:
              split.role,


            amount:
              Number(
                split.amount
              ),


            status:
              "pending",

          })

        }

      }





      setCommissionId("")


      setSplits([
        {...emptySplit},
        {...emptySplit},
        {...emptySplit},
      ])





      onOpenChange(false)

      router.refresh()



    }catch(error){


      console.error(
        error
      )


      setError("Unable to save the commission split. Please try again.")


    }finally{

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

      title={
        isEditing
          ? "Edit Commission Split"
          : "Record Commission Split"
      }

      description="Split commission between team members."

    >


      <form

        onSubmit={
          submit
        }

        className="space-y-5"

      >



        <select

          className="w-full rounded-lg border p-3"

          value={
            commissionId
          }

          onChange={
            e =>
              setCommissionId(
                e.target.value
              )
          }

          required

          disabled={
            isEditing
          }

        >

          <option value="">
            Select Commission
          </option>


          {
            commissions.map(
              commission => (

                <option

                  key={
                    commission.id
                  }

                  value={
                    commission.id
                  }

                >

                  {
                    commission.dealName
                  }

                  {" - "}

                  ₹
                  {
                    commission.amount.toLocaleString(
                      "en-IN"
                    )
                  }

                </option>

              )
            )
          }


        </select>





        <div className="rounded-xl bg-muted p-4 space-y-1">

          <p>

            Total Commission:
            {" "}
            ₹
            {
              totalCommission.toLocaleString(
                "en-IN"
              )
            }

          </p>


          <p>

            Allocated:
            {" "}
            ₹
            {
              allocated.toLocaleString(
                "en-IN"
              )
            }

          </p>


          <p className="font-semibold">

            Remaining:
            {" "}
            ₹
            {
              remaining.toLocaleString(
                "en-IN"
              )
            }

          </p>


        </div>





        {
          splits.map(
            (
              split,
              index
            ) => (

              <div

                key={`${index}-${split.userId}`}

                className="space-y-3 rounded-xl border p-4"

              >


                <p className="font-medium">

                  Person {index + 1}

                </p>





                <select

                  className="w-full rounded-lg border p-3"

                  value={
                    split.userId
                  }

                  onChange={
                    e =>
                      updateSplit(
                        index,
                        "userId",
                        e.target.value
                      )
                  }

                >

                  <option value="">

                    Select person

                  </option>


                  {
                    users.map(
                      user => (

                        <option

                          key={
                            user.id
                          }

                          value={
                            user.id
                          }

                        >

                          {
                            user.name
                          }

                        </option>

                      )
                    )
                  }


                </select>





                <select

                  className="w-full rounded-lg border p-3"

                  value={
                    split.role
                  }

                  onChange={
                    e =>
                      updateSplit(
                        index,
                        "role",
                        e.target.value as CommissionDistributionRole
                      )
                  }

                >

                  <option value="partner">
                    Partner
                  </option>


                  <option value="sales">
                    Sales
                  </option>


                  <option value="client_source">
                    Client Source
                  </option>


                  <option value="inventory_source">
                    Inventory Source
                  </option>


                  <option value="client_inventory">
                    Client + Inventory
                  </option>


                  <option value="other">
                    Other
                  </option>


                </select>





                <input

                  className="w-full rounded-lg border p-3"

                  type="number"

                  placeholder="Amount"

                  value={
                    split.amount
                  }

                  onChange={
                    e =>
                      updateSplit(
                        index,
                        "amount",
                        e.target.value
                      )
                  }

                />


              </div>

            )

          )
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

          type="submit"

          disabled={
            loading ||
            allocated >
            totalCommission ||
            !selectedCommission ||
            activeSplits.length === 0 ||
            hasIncompleteSplit ||
            hasDuplicateRecipients
          }

          className="w-full sm:w-auto"

        >

          {
            loading
              ? "Saving..."
              : isEditing
                ? "Update Commission Split"
                : "Save Commission Split"
          }


        </Button>
        </div>


      </form>


    </FormDrawer>

  )

}
