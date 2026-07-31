"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Handshake,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  Textarea,
} from "@/components/ui/textarea"

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





type UserProfile = {

  id:string

  name:string

  role:string

}





export default function NewDealPage() {


  const router =
    useRouter()



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
    useState<UserProfile[]>([])



  const [
    saving,
    setSaving,
  ] =
    useState(false)





  const [
    form,
    setForm,
  ] =
    useState({

      name:"",

      contactId:"",

      propertyId:"",

      propertyPrice:"",

      commissionPercentage:"2",

      commissionAmount:"",

      probability:"20",

      expectedCloseDate:"",

      advisor:"",

      advisorId:"",

      priority:"medium",

      notes:"",

    })





  useEffect(() => {


    async function load(){


      const [
        contactData,
        propertyData,
        userData,
      ] =
      await Promise.all([


        ContactsRepository.getAll(),


        getProperties(),


        supabase
          .from("user_profiles")
          .select("id,name,role")
          .eq(
            "role",
            "sales"
          )
          .then(
            result =>
              result.data ?? []
          ),

      ])




      setContacts(
        contactData
      )


      setProperties(
        propertyData
      )


      setUsers(
        userData
      )


    }


    load()


  }, [])







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







  function calculateCommission(
    price:string,
    percentage:string
  ){

    if(!price){

      return ""

    }


    return String(

      Number(price)
      *
      Number(percentage)
      /
      100

    )

  }







  async function save(
    event:React.FormEvent
  ){

    event.preventDefault()


    setSaving(true)



    try {


      const deal =
        await createDeal({

          name:
            form.name,


          contactId:
            form.contactId,


          propertyId:
            form.propertyId,


          stage:
            "lead",


          advisor:
            form.advisor,


          advisorId:
            form.advisorId,


          value:{

  propertyPrice:
    Number(
      form.propertyPrice || 0
    ),


  commissionType:
    "sale",


  commissionBasis:
    "percentage",


  commissionPercentage:
    Number(
      form.commissionPercentage || 2
    ),


  commissionAmount:
    Number(
      form.commissionAmount || 0
    ),

},


          probability:
            Number(
              form.probability
            ),


          expectedCloseDate:
            form.expectedCloseDate,


          priority:
            form.priority as
              "low"
              |
              "medium"
              |
              "high",


          notes:
            form.notes
            ?
            [
              form.notes,
            ]
            :
            [],


          tasks:
            [],


          lastActivity:
            new Date()
              .toISOString(),

        })



      router.push(
        `/deals/${deal.id}`
      )



    } catch(error){


      console.error(
        error
      )


      alert(
        "Unable to create deal"
      )


    } finally {


      setSaving(false)

    }


  }







  return (

    <div className="mx-auto max-w-4xl space-y-8 p-8">


      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-primary/10 p-3">

          <Handshake className="h-6 w-6 text-primary"/>

        </div>


        <div>

          <h1 className="text-3xl font-bold">
            New Deal
          </h1>

          <p className="text-muted-foreground">
            Create a new transaction.
          </p>

        </div>

      </div>





      <form
        onSubmit={save}
        className="rounded-2xl border bg-card p-8 space-y-5"
      >


        <Input
          placeholder="Deal Name"
          value={form.name}
          onChange={
            e =>
              update(
                "name",
                e.target.value
              )
          }
        />



        <select
          className="w-full rounded-lg border p-3"
          value={form.contactId}
          onChange={
            e =>
              update(
                "contactId",
                e.target.value
              )
          }
        >

          <option value="">
            Select Buyer
          </option>

          {
            contacts.map(
              contact => (

                <option
                  key={contact.id}
                  value={contact.id}
                >
                  {contact.name}
                </option>

              )
            )
          }

        </select>




        <select
          className="w-full rounded-lg border p-3"
          value={form.propertyId}
          onChange={
            e =>
              update(
                "propertyId",
                e.target.value
              )
          }
        >

          <option value="">
            Select Property
          </option>


          {
            properties.map(
              property => (

                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>

              )
            )
          }

        </select>




        <Input
          placeholder="Property Value"
          value={form.propertyPrice}
          onChange={
            e =>
              update(
                "propertyPrice",
                e.target.value
              )
          }
        />



        <Input
          placeholder="Commission %"
          value={form.commissionPercentage}
          onChange={
            e =>
              update(
                "commissionPercentage",
                e.target.value
              )
          }
        />



        <Input
          placeholder="Probability %"
          value={form.probability}
          onChange={
            e =>
              update(
                "probability",
                e.target.value
              )
          }
        />



        <Input
          type="date"
          value={form.expectedCloseDate}
          onChange={
            e =>
              update(
                "expectedCloseDate",
                e.target.value
              )
          }
        />





        <select
          className="w-full rounded-lg border p-3"
          value={form.advisorId}
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
                  key={user.id}
                  value={user.id}
                >
                  {user.name}
                </option>

              )
            )
          }


        </select>





        <select
          className="w-full rounded-lg border p-3"
          value={form.priority}
          onChange={
            e =>
              update(
                "priority",
                e.target.value
              )
          }
        >

          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>

        </select>





        <Textarea
          placeholder="Notes"
          value={form.notes}
          onChange={
            e =>
              update(
                "notes",
                e.target.value
              )
          }
        />





        <Button disabled={saving}>

          {
            saving
            ?
            "Creating..."
            :
            "Create Deal"
          }

        </Button>


      </form>


    </div>

  )

}