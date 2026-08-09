"use client"

import {
  useEffect,
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
  createDeal,
} from "@/lib/repositories/deal-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  supabase,
} from "@/lib/supabase/client"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"



type DealDrawerProps = {

  open:boolean

  onOpenChange:(open:boolean)=>void

}



type SalesUser = {

  id:string

  name:string

  role:string

}





export function DealDrawer({

  open,

  onOpenChange,

}:DealDrawerProps){



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
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    users,
    setUsers,
  ] =
  useState<SalesUser[]>([])





  const [
    form,
    setForm,
  ] =
  useState({

    name:"",

    contactId:"",

    propertyId:"",

    advisor:"",

    advisorId:"",

    price:"",

  })





  const selectedProperty =
    properties.find(
      property =>
        property.id === form.propertyId
    )



  const isRental =
    selectedProperty?.transactionType === "Rental"

  const eligibleContacts =
    contacts.filter(
      contact =>
        contact.relationshipTypes?.some(
          relationship =>
            ["buyer", "tenant", "investor"].includes(
              relationship.toLowerCase()
            )
        )
    )







  useEffect(()=>{


    async function loadData(){


      try {


        const buyers =
          await ContactsRepository.getAll()



        const inventory =
          await getProperties()



        const {
          data:salesUsers,
          error,
        } =
          await supabase
            .from("user_profiles")
            .select(
              "id,name,role"
            )



        if(error){

          console.error(
            "Failed loading sales users:",
            error
          )

        }



        setContacts(
          buyers
        )


        setProperties(
          inventory
        )


        setUsers(
          salesUsers ?? []
        )



      } catch(error){


        console.error(
          "Failed loading deal data",
          error
        )


      }


    }



    if(open){

      loadData()

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







  function selectAdvisor(
    id:string
  ){


    const user =
      users.find(
        item =>
          item.id === id
      )



    setForm(
      current => ({

        ...current,

        advisorId:
          id,


        advisor:
          user?.name ?? "",

      })
    )


  }

  function selectProperty(
    id:string
  ){

    const property =
      properties.find(
        item =>
          item.id === id
      )

    const propertyPrice =
      property?.transactionType === "Rental"
        ? property.price.rent
        : property?.price.asking

    setForm(
      current => ({
        ...current,
        propertyId: id,
        price:
          current.price ||
          propertyPrice?.toString() ||
          "",
      })
    )

  }








  async function submit(
    e:React.FormEvent
  ){


    e.preventDefault()



    if(
      !form.name.trim() ||
      !form.contactId ||
      !form.propertyId ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ){

      setError(
        "Enter a deal name, select a client and property, and add a valid value."
      )

      return

    }



    setLoading(true)
    setError(null)



    try {


      const price =
        Number(
          form.price || 0
        )



      const commissionPercentage =
  isRental
    ? undefined
    : (
        selectedProperty?.price?.commission
        ??
        2
      )


const commissionAmount =

  isRental

    ?

      Number(
        selectedProperty?.price?.rent ?? 0
      )

    :

      (
        price *
        Number(
          commissionPercentage
        )
        /
        100
      )





      await createDeal({

        name:
          form.name.trim(),


        contactId:
          form.contactId,


        propertyId:
          form.propertyId,


        advisor:
          form.advisor,


        advisorId:
          form.advisorId,



        stage:
          "lead",



        probability:
          10,



        value:{

          propertyPrice:
            price,


          commissionType:
            isRental
              ? "rental"
              : "sale",


          commissionBasis:
            isRental
              ? "fixed"
              : "percentage",


          commissionPercentage:
  commissionPercentage,


          commissionAmount:
            commissionAmount,

        },



        priority:
          "medium",



        tasks:
          [],



        lastActivity:
          new Date()
          .toISOString(),

      })



      setForm({

        name:"",

        contactId:"",

        propertyId:"",

        advisor:"",

        advisorId:"",

        price:"",

      })



      onOpenChange(false)



    } catch(error){


      console.error(
        "Deal creation failed",
        error
      )


      setError("Unable to create the deal. Please try again.")


    } finally {


      setLoading(false)

    }


  }







  return (

    <FormDrawer

      open={open}

      onOpenChange={onOpenChange}

      title="New Deal"

      description="Create a new transaction."

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

          onChange={
            e =>
              update(
                "name",
                e.target.value
              )
          }

          required

        />





        <select

          className="w-full rounded-lg border p-3"

          value={
            form.contactId
          }

          onChange={
            e =>
              update(
                "contactId",
                e.target.value
              )
          }

          required

        >

          <option value="">
            Select Buyer
          </option>


          {
            eligibleContacts.map(
              contact => (

                <option

                  key={
                    contact.id
                  }

                  value={
                    contact.id
                  }

                >

                  {contact.name}

                </option>

              )
            )
          }
        </select>





        <select

          className="w-full rounded-lg border p-3"

          value={
            form.propertyId
          }

          onChange={
            e =>
              selectProperty(
                e.target.value
              )
          }

          required

        >

          <option value="">
            Select Property
          </option>


          {
            properties.map(
              property => (

                <option

                  key={
                    property.id
                  }

                  value={
                    property.id
                  }

                >

                  {property.name}

                </option>

              )
            )
          }


        </select>





        <select

          className="w-full rounded-lg border p-3"

          value={
            form.advisorId
          }

          onChange={
            e =>
              selectAdvisor(
                e.target.value
              )
          }

        >

          <option value="">
            Assign Sales Person
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

                  {user.name}

                </option>

              )
            )
          }


        </select>





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

          required

          onChange={
            e =>
              update(
                "price",
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
            ?
            "Creating..."
            :
            "Create Deal"
          }

        </Button>
        </div>


      </form>


    </FormDrawer>

  )

}
