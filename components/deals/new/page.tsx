"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  Handshake,
} from "lucide-react"

import {
  useRouter,
} from "next/navigation"

import {
  createDeal,
} from "@/lib/repositories/deal-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"


export default function NewDealPage() {

  const router = useRouter()


  const [
    contacts,
    setContacts,
  ] = useState<Contact[]>([])


  const [
    properties,
    setProperties,
  ] = useState<Property[]>([])


  const [
    loading,
    setLoading,
  ] = useState(false)



  const [
    form,
    setForm,
  ] = useState({

    name: "",

    contactId: "",

    propertyId: "",

    advisor: "",

    propertyPrice: "",

    commissionPercentage: "2",

  })



  useEffect(() => {

    async function load() {

      const [
        buyers,
        inventory,
      ] = await Promise.all([

        ContactsRepository.getAll(),

        getProperties(),

      ])


      setContacts(
        buyers
      )


      setProperties(
        inventory
      )

    }


    load()

  }, [])



  const commissionAmount =
    Number(form.propertyPrice || 0) *
    Number(form.commissionPercentage || 0) /
    100



  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setLoading(true)


    try {

      await createDeal({

        name:
          form.name ||
          "New Deal",


        contactId:
          form.contactId,


        propertyId:
          form.propertyId,


        advisor:
          form.advisor,


        stage:
          "lead",


        probability:
          10,


        value: {

          propertyPrice:
            Number(
              form.propertyPrice
            ),


          commissionPercentage:
            Number(
              form.commissionPercentage
            ),


          commissionAmount,

        },


        priority:
          "medium",


        tasks:
          [],


        lastActivity:
          new Date().toISOString(),

      })


      router.push("/deals")


    } catch (error) {

      console.error(
        "Failed creating deal",
        error
      )


    } finally {

      setLoading(false)

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
            Create a buyer-property transaction.
          </p>

        </div>

      </div>



      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-card p-8 space-y-5"
      >


        <input
          className="w-full rounded-lg border p-3"
          placeholder="Deal Name"
          value={form.name}
          onChange={(e)=>
            setForm({
              ...form,
              name:e.target.value,
            })
          }
        />



        <select
          className="w-full rounded-lg border p-3"
          value={form.contactId}
          onChange={(e)=>
            setForm({
              ...form,
              contactId:e.target.value,
            })
          }
        >

          <option value="">
            Select Buyer
          </option>


          {contacts.map((contact)=>(
            <option
              key={contact.id}
              value={contact.id}
            >
              {contact.name}
            </option>
          ))}

        </select>



        <select
          className="w-full rounded-lg border p-3"
          value={form.propertyId}
          onChange={(e)=>
            setForm({
              ...form,
              propertyId:e.target.value,
            })
          }
        >

          <option value="">
            Select Property
          </option>


          {properties.map((property)=>(
            <option
              key={property.id}
              value={property.id}
            >
              {property.name}
            </option>
          ))}

        </select>



        <input
          className="w-full rounded-lg border p-3"
          placeholder="Advisor"
          value={form.advisor}
          onChange={(e)=>
            setForm({
              ...form,
              advisor:e.target.value,
            })
          }
        />



        <input
          className="w-full rounded-lg border p-3"
          placeholder="Property Price"
          type="number"
          value={form.propertyPrice}
          onChange={(e)=>
            setForm({
              ...form,
              propertyPrice:e.target.value,
            })
          }
        />



        <input
          className="w-full rounded-lg border p-3"
          placeholder="Commission %"
          type="number"
          value={form.commissionPercentage}
          onChange={(e)=>
            setForm({
              ...form,
              commissionPercentage:e.target.value,
            })
          }
        />



        <div className="rounded-lg bg-muted p-4">
          Expected Commission:
          {" "}
          ₹{commissionAmount.toLocaleString()}
        </div>



        <button
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-3 text-primary-foreground"
        >

          {loading
            ? "Creating..."
            : "Create Deal"}

        </button>


      </form>


    </div>

  )

}