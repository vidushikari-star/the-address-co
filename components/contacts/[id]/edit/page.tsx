"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
  useParams,
} from "next/navigation"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"


import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"


export default function EditContactPage() {

  const router =
    useRouter()

  const params =
    useParams()

  const id =
    params.id as string


  


  const [loading, setLoading] =
    useState(true)


  const [saving, setSaving] =
    useState(false)



  const [form, setForm] =
    useState({

      fullName: "",

      phone: "",

      email: "",

      whatsapp: "",

      city: "",

      country: "",

      budgetMin: "",

      budgetMax: "",

      propertyType: "",

      bedrooms: "",

      locations: "",

      timeline: "",

      notes: "",

    })



  useEffect(() => {

    async function loadContact() {

      const data =
        await ContactsRepository.getById(
          id
        )


      


      setForm({

        fullName:
          data.name ?? "",

        phone:
          data.phone ?? "",

        email:
          data.email ?? "",

        whatsapp:
          data.whatsapp ?? "",

        city:
          data.city ?? "",

        country:
          data.country ?? "",

        budgetMin:
          data.budgetMin
            ? String(data.budgetMin)
            : "",

        budgetMax:
          data.budgetMax
            ? String(data.budgetMax)
            : "",

        propertyType:
          data.propertyType ?? "",

        bedrooms:
          data.bedrooms
            ? String(data.bedrooms)
            : "",

        locations:
          data.locations?.join(", ") ?? "",

        timeline:
          data.timeline ?? "",

        notes:
          data.notesText ?? "",

      })


      setLoading(false)

    }


    loadContact()

  }, [id])



  function update(
    key: string,
    value: string
  ) {

    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    )

  }



  async function save() {

    setSaving(true)


    await ContactsRepository.update(
      id,
      {

        fullName:
          form.fullName,

        phone:
          form.phone,

        email:
          form.email,

        whatsapp:
          form.whatsapp,

        city:
          form.city,

        country:
          form.country,

        budgetMin:
          form.budgetMin
            ? Number(form.budgetMin)
            : undefined,

        budgetMax:
          form.budgetMax
            ? Number(form.budgetMax)
            : undefined,

        propertyType:
          form.propertyType,

        bedrooms:
          form.bedrooms,

        locations:
          form.locations
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean),

        timeline:
          form.timeline,

        notes:
          form.notes,

      }
    )


    router.push(
      `/contacts/${id}`
    )

  }



  if (loading) {

    return (
      <div className="p-8">
        Loading...
      </div>
    )

  }



  return (

    <div className="mx-auto max-w-4xl space-y-8 p-8">


      <div>

        <h1 className="text-3xl font-bold">
          Edit Contact
        </h1>

        <p className="text-muted-foreground">
          Update buyer information and requirements.
        </p>

      </div>



      <div className="rounded-2xl border bg-card p-8 space-y-5">


        <Input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) =>
            update(
              "fullName",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            update(
              "phone",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            update(
              "email",
              e.target.value
            )
          }
        />



        <Input
          placeholder="WhatsApp"
          value={form.whatsapp}
          onChange={(e) =>
            update(
              "whatsapp",
              e.target.value
            )
          }
        />



        <div className="grid gap-4 md:grid-cols-2">

          <Input
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              update(
                "city",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Country"
            value={form.country}
            onChange={(e) =>
              update(
                "country",
                e.target.value
              )
            }
          />

        </div>




        <div className="grid gap-4 md:grid-cols-2">

          <Input
            placeholder="Minimum Budget"
            value={form.budgetMin}
            onChange={(e) =>
              update(
                "budgetMin",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Maximum Budget"
            value={form.budgetMax}
            onChange={(e) =>
              update(
                "budgetMax",
                e.target.value
              )
            }
          />

        </div>




        <Input
          placeholder="Property Type"
          value={form.propertyType}
          onChange={(e) =>
            update(
              "propertyType",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Bedrooms"
          value={form.bedrooms}
          onChange={(e) =>
            update(
              "bedrooms",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Preferred Locations"
          value={form.locations}
          onChange={(e) =>
            update(
              "locations",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Timeline"
          value={form.timeline}
          onChange={(e) =>
            update(
              "timeline",
              e.target.value
            )
          }
        />



        <Textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) =>
            update(
              "notes",
              e.target.value
            )
          }
        />



        <Button
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>


      </div>


    </div>

  )
}