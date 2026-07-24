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
  Input,
} from "@/components/ui/input"

import {
  Button,
} from "@/components/ui/button"

import {
  supabase,
} from "@/lib/supabase/client"

import {
  createCommissionDistribution,
} from "@/lib/repositories/commission-distribution-repository"


import type {
  CommissionDistributionRole,
} from "@/types/commission-distribution"


type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  commissionId:string

}





export function AddDistributionDrawer({

  open,

  onOpenChange,

  commissionId,

}:Props){


  const router =
    useRouter()



  const [
    users,
    setUsers,
  ] =
  useState<any[]>([])



  const [
    loadingUsers,
    setLoadingUsers,
  ] =
  useState(false)



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

    userId:"",

    role:"partner",

    amount:"",

    status:"pending",

    notes:"",

  })





  useEffect(()=>{


    async function loadUsers(){


      setLoadingUsers(true)


      const {
        data,
        error,
      } =
      await supabase
        .from("user_profiles")
        .select(
          "id,name"
        )
        .order(
          "name"
        )



      if(!error){

        setUsers(
          data ?? []
        )

      }


      setLoadingUsers(false)


    }


    if(open){

      loadUsers()

    }


  },[open])







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







  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()


    setLoading(true)



    try{


      await createCommissionDistribution({

        commissionId,

        userId:
          form.userId,


        role:
  form.role as CommissionDistributionRole,


        amount:
          Number(
            form.amount
          ),


        status:
          form.status as any,


        notes:
          form.notes,

      })



      setForm({

        userId:"",

        role:"partner" as CommissionDistributionRole,

        amount:"",

        status:"pending",

        notes:"",

      })



      onOpenChange(false)

      router.refresh()



    }catch(error){


      console.error(
        "Distribution creation failed",
        error
      )


      alert(
        "Could not add distribution"
      )


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

      title="Add Commission Distribution"

      description="Record commission split manually."

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
            form.userId
          }

          onChange={
            e =>
              update(
                "userId",
                e.target.value
              )
          }

          required

        >

          <option value="">

            {
              loadingUsers
                ? "Loading users..."
                : "Select person"
            }

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
            form.role
          }

          onChange={
            e =>
              update(
                "role",
                e.target.value
              )
          }

        >

          <option value="partner">
            Partner
          </option>


          <option value="sales_partner">
            Sales Partner
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


        </select>







        <Input

          placeholder="Amount"

          type="number"

          value={
            form.amount
          }

          onChange={
            e =>
              update(
                "amount",
                e.target.value
              )
          }

          required

        />







        <select

          className="w-full rounded-lg border p-3"

          value={
            form.status
          }

          onChange={
            e =>
              update(
                "status",
                e.target.value
              )
          }

        >

          <option value="pending">
            Pending
          </option>


          <option value="paid">
            Received
          </option>


        </select>







        <textarea

          className="min-h-24 w-full rounded-lg border p-3"

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







        <Button

          type="submit"

          disabled={
            loading
          }

        >

          {
            loading
              ? "Saving..."
              : "Save Distribution"
          }

        </Button>


      </form>


    </FormDrawer>

  )

}