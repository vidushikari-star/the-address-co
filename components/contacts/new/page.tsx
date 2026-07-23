"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  UserPlus,
} from "lucide-react"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"


const leadSources = [
  "instagram",
  "housing",
  "magicbricks",
  "99acres",
  "website",
  "whatsapp",
  "referral",
  "broker",
  "other",
]


const propertyTypes = [
  "villa",
  "apartment",
  "plot",
  "commercial",
]


export default function NewBuyerPage() {

  const router =
    useRouter()


  const [loading, setLoading] =
    useState(false)


  const [form, setForm] =
    useState({

      fullName: "",

      phone: "",

      email: "",

      whatsapp: "",

      city: "",

      country: "",

      leadSource: "referral",

      budgetMin: "",

      budgetMax: "",

      propertyType: "villa",

      bedrooms: "",

      purpose: "self_use",

      financing: "cash",

      timeline: "",

      locations: "",

      mustHave: "",

      notes: "",

    })



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



  async function handleSubmit(
    event: React.FormEvent
  ) {

    event.preventDefault()

    setLoading(true)


    try {

      const contact =
        await ContactsRepository.create({

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


          leadSource:
            form.leadSource,


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


          purpose:
            form.purpose,


          financing:
            form.financing,


          timeline:
            form.timeline,


          locations:
            form.locations
              .split(",")
              .map(
                (item) =>
                  item.trim()
              )
              .filter(Boolean),


          mustHave:
            form.mustHave
              .split(",")
              .map(
                (item) =>
                  item.trim()
              )
              .filter(Boolean),


          notes:
            form.notes,

        })


      router.push(
        `/contacts/${contact.id}`
      )


    } catch (error) {

      console.error(
        "Failed creating contact",
        error
      )

      alert(
        "Unable to create buyer"
      )

    } finally {

      setLoading(false)

    }

  }



  return (

    <div className="mx-auto max-w-4xl space-y-8 p-8">


      <div className="flex items-center gap-3">

        <div className="rounded-xl bg-primary/10 p-3">

          <UserPlus className="h-6 w-6 text-primary" />

        </div>


        <div>

          <h1 className="text-3xl font-bold">
            New Buyer
          </h1>


          <p className="text-muted-foreground">
            Add a new buyer to your CRM.
          </p>

        </div>

      </div>



      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-card p-8 space-y-6"
      >


        <input
          required
          placeholder="Full Name"
          className="w-full rounded-lg border p-3"
          value={form.fullName}
          onChange={(e) =>
            update(
              "fullName",
              e.target.value
            )
          }
        />


        <input
          required
          placeholder="Phone"
          className="w-full rounded-lg border p-3"
          value={form.phone}
          onChange={(e) =>
            update(
              "phone",
              e.target.value
            )
          }
        />


        <input
          placeholder="Email"
          className="w-full rounded-lg border p-3"
          value={form.email}
          onChange={(e) =>
            update(
              "email",
              e.target.value
            )
          }
        />


        <input
          placeholder="WhatsApp"
          className="w-full rounded-lg border p-3"
          value={form.whatsapp}
          onChange={(e) =>
            update(
              "whatsapp",
              e.target.value
            )
          }
        />



        <div className="grid gap-4 md:grid-cols-2">

          <input
            placeholder="City"
            className="rounded-lg border p-3"
            value={form.city}
            onChange={(e) =>
              update(
                "city",
                e.target.value
              )
            }
          />


          <input
            placeholder="Country"
            className="rounded-lg border p-3"
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

          <input
            placeholder="Minimum Budget"
            className="rounded-lg border p-3"
            value={form.budgetMin}
            onChange={(e) =>
              update(
                "budgetMin",
                e.target.value
              )
            }
          />


          <input
            placeholder="Maximum Budget"
            className="rounded-lg border p-3"
            value={form.budgetMax}
            onChange={(e) =>
              update(
                "budgetMax",
                e.target.value
              )
            }
          />

        </div>



        <select
          className="w-full rounded-lg border p-3"
          value={form.propertyType}
          onChange={(e) =>
            update(
              "propertyType",
              e.target.value
            )
          }
        >

          {propertyTypes.map(
            (type) => (

              <option
                key={type}
                value={type}
              >
                {type}
              </option>

            )
          )}

        </select>



        <input
          placeholder="Preferred Locations (comma separated)"
          className="w-full rounded-lg border p-3"
          value={form.locations}
          onChange={(e) =>
            update(
              "locations",
              e.target.value
            )
          }
        />



        <input
          placeholder="Bedrooms"
          className="w-full rounded-lg border p-3"
          value={form.bedrooms}
          onChange={(e) =>
            update(
              "bedrooms",
              e.target.value
            )
          }
        />



        <input
          placeholder="Timeline"
          className="w-full rounded-lg border p-3"
          value={form.timeline}
          onChange={(e) =>
            update(
              "timeline",
              e.target.value
            )
          }
        />



        <input
          placeholder="Must have features (comma separated)"
          className="w-full rounded-lg border p-3"
          value={form.mustHave}
          onChange={(e) =>
            update(
              "mustHave",
              e.target.value
            )
          }
        />



        <textarea
          placeholder="Notes"
          className="w-full rounded-lg border p-3"
          value={form.notes}
          onChange={(e) =>
            update(
              "notes",
              e.target.value
            )
          }
        />



        <button
          disabled={loading}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground"
        >
          {loading
            ? "Saving..."
            : "Create Buyer"
          }
        </button>


      </form>


    </div>

  )
}