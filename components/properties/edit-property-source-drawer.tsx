"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import {
  updatePropertyContact,
} from "@/lib/repositories/property-contact-repository"

import {
  addPropertyCommission,
  updatePropertyCommission,
} from "@/lib/repositories/property-commission-repository"

import {
  addContactRelationshipType,
} from "@/lib/supabase/repositories/contact-relationship.repository"

import {
  Button,
} from "@/components/ui/button"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import type {
  PropertyContactRelationship,
  TransactionType,
} from "@/types/property"



type EditPropertySourceDrawerProps = {

  open: boolean

  onOpenChange: (open: boolean) => void

  propertyId: string

  propertyValue: number

  transactionType: TransactionType

  source: PropertySource

  contacts: {
    id: string
    firstName?: string
    lastName?: string | null
    fullName?: string
  }[]

  onSaved: () => void

}



function getContactName(
  contact: EditPropertySourceDrawerProps["contacts"][number]
){


  return (
    [
      contact.firstName,
      contact.lastName,
    ]
    .filter(Boolean)
    .join(" ")
    ||
    contact.fullName
    ||
    "Unnamed Contact"
  )

}



export function EditPropertySourceDrawer({
  open,
  onOpenChange,
  propertyId,
  propertyValue,
  transactionType,
  source,
  contacts,
  onSaved,
}: EditPropertySourceDrawerProps) {


  const [
    contactId,
    setContactId,
  ] =
  useState(source.contact.id)



  const [
    relationshipType,
    setRelationshipType,
  ] =
  useState<PropertyContactRelationship>(
    source.relationshipType
  )



  const [
    commissionPercentage,
    setCommissionPercentage,
  ] =
  useState(
    source.commission?.percentage?.toString()
    ??
    ""
  )



  const [
    saving,
    setSaving,
  ] =
  useState(false)

  const [
    error,
    setError,
  ] =
  useState<string | null>(null)

  useEffect(() => {

    if(!open){

      return

    }

    setContactId(source.contact.id)
    setRelationshipType(source.relationshipType)
    setCommissionPercentage(
      source.commission?.percentage?.toString()
      ?? ""
    )
    setError(null)

  }, [
    open,
    source,
  ])



  const parsedPercentage =
    commissionPercentage.trim()
      ? Number(commissionPercentage)
      : null



  const percentageIsValid =
    parsedPercentage === null
    ||
    (
      Number.isFinite(parsedPercentage)
      &&
      parsedPercentage >= 0
    )



  const commissionValue =
    parsedPercentage !== null
    &&
    percentageIsValid
      ? propertyValue * parsedPercentage / 100
      : null



  async function submit(){


    if(
      !contactId
      ||
      !percentageIsValid
    ){

      setError("Select a contact and enter a valid commission percentage.")

      return

    }



    setSaving(true)
    setError(null)



    try {


      await updatePropertyContact({

        id: source.id,

        contactId,

        relationshipType,

      })



      await addContactRelationshipType(
        contactId,
        relationshipType
      )



      if(source.commission){

        await updatePropertyCommission({

          id: source.commission.id,

          contactId,

          sourceType: relationshipType,

          percentage: parsedPercentage,

        })

      }

      else if(parsedPercentage !== null){

        await addPropertyCommission({

          propertyId,

          contactId,

          transactionType,

          sourceType: relationshipType,

          commissionType: "percentage",

          percentage: parsedPercentage,

        })

      }



      onSaved()

      onOpenChange(false)


    }
    catch(error){

      console.error("Unable to update property source", error)
      setError("Unable to save the property source. Please try again.")

    }
    finally {

      setSaving(false)

    }


  }



  return (

    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Property Source"
      description="Update the linked seller contact and commission for this property."
    >

      <div className="space-y-4">

        <div className="space-y-2">

          <label
            htmlFor="property-source-relationship"
            className="text-sm font-medium"
          >
            Seller relationship
          </label>

          <select
            id="property-source-relationship"
            className="w-full rounded-lg border p-3"
            value={relationshipType}
            onChange={
              event =>
                setRelationshipType(
                  event.target.value as PropertyContactRelationship
                )
            }
          >
            <option value="owner">Owner</option>
            <option value="developer">Developer</option>
            <option value="mou_holder">MOU Holder</option>
            <option value="broker">Broker</option>
          </select>

        </div>



        <div className="space-y-2">

          <label
            htmlFor="property-source-contact"
            className="text-sm font-medium"
          >
            Linked seller contact
          </label>

          <select
            id="property-source-contact"
            className="w-full rounded-lg border p-3"
            value={contactId}
            onChange={
              event =>
                setContactId(event.target.value)
            }
          >
            <option value="">Select Contact</option>

            {
              contacts.map(
                contact => (

                  <option
                    key={contact.id}
                    value={contact.id}
                  >
                    {getContactName(contact)}
                  </option>

                )
              )
            }

          </select>

        </div>



        <div className="space-y-2">

          <label
            htmlFor="property-source-commission"
            className="text-sm font-medium"
          >
            Commission (% of property value)
          </label>

          <input
            id="property-source-commission"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="w-full rounded-lg border p-3"
            value={commissionPercentage}
            onChange={
              event =>
                setCommissionPercentage(event.target.value)
            }
          />

          {
            commissionValue !== null && (

              <p className="text-sm text-muted-foreground">
                ₹{commissionValue.toLocaleString("en-IN")} on the property value.
              </p>

            )
          }

          {
            !percentageIsValid && (

              <p className="text-sm text-destructive">
                Enter a valid non-negative percentage.
              </p>

            )
          }

        </div>



        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          onClick={submit}
          disabled={
            saving
            ||
            !contactId
            ||
            !percentageIsValid
          }
        >
          {
            saving
              ? "Saving..."
              : "Save Source"
          }
        </Button>

      </div>

    </FormDrawer>

  )

}
