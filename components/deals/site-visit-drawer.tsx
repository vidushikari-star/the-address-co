"use client"

import {
  useEffect,
  useState,
} from "react"

import { FormDrawer } from "@/components/forms/form-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getProperties } from "@/lib/repositories/property-repository"
import { createSiteVisitWithActivity } from "@/lib/services/site-visit-workflow"
import { supabase } from "@/lib/supabase/client"

import type { Property } from "@/types/property"

type Advisor = {
  id: string
  name: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  dealId?: string
  contactId: string
}

const emptyForm = {
  propertyId: "",
  date: "",
  time: "",
  notes: "",
}

export function SiteVisitDrawer({
  open,
  onOpenChange,
  onCreated,
  dealId,
  contactId,
}: Props) {
  const [properties, setProperties] = useState<Property[]>([])
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [form, setForm] = useState(emptyForm)
  const [advisorId, setAdvisorId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [propertiesData, advisorsResult] = await Promise.all([
          getProperties(),
          supabase
            .from("user_profiles")
            .select("id,name")
            .order("name"),
        ])

        setProperties(propertiesData)
        setAdvisors(advisorsResult.data ?? [])
      } catch (error) {
        console.error("Unable to load site visit options", error)
        setError("Unable to load properties or advisors. Please try again.")
      }
    }

    if (open) {
      setError(null)
      load()
    }
  }, [open])

  function update(
    key: keyof typeof emptyForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.propertyId || !form.date || !form.time) {
      setError("Select a property, visit date, and time before scheduling.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createSiteVisitWithActivity({
        dealId,
        contactId,
        propertyId: form.propertyId,
        scheduledDate: form.date,
        scheduledTime: form.time,
        notes: form.notes.trim() || undefined,
        advisorId: advisorId || undefined,
        activityDescription: properties.find(
          (item) => item.id === form.propertyId
        )?.name ?? "Property",
      })

      setForm(emptyForm)
      setAdvisorId("")
      onOpenChange(false)
      onCreated?.()
    } catch (error) {
      console.error("Failed creating site visit", error)
      setError("Unable to schedule the site visit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Site Visit"
      description="Choose a property, time, and advisor for this contact."
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="space-y-2">
          <label
            htmlFor="site-visit-property"
            className="text-sm font-medium"
          >
            Property <span className="text-destructive">*</span>
          </label>

          <select
            id="site-visit-property"
            className="w-full rounded-lg border bg-background p-3"
            value={form.propertyId}
            onChange={(event) => update("propertyId", event.target.value)}
            required
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="site-visit-date"
              className="text-sm font-medium"
            >
              Visit date <span className="text-destructive">*</span>
            </label>
            <Input
              id="site-visit-date"
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="site-visit-time"
              className="text-sm font-medium"
            >
              Visit time <span className="text-destructive">*</span>
            </label>
            <Input
              id="site-visit-time"
              type="time"
              value={form.time}
              onChange={(event) => update("time", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="site-visit-advisor"
            className="text-sm font-medium"
          >
            Assigned advisor
          </label>
          <select
            id="site-visit-advisor"
            className="w-full rounded-lg border bg-background p-3"
            value={advisorId}
            onChange={(event) => setAdvisorId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {advisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="site-visit-notes"
            className="text-sm font-medium"
          >
            Notes
          </label>
          <Textarea
            id="site-visit-notes"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Access instructions, requirements, or attendees"
            rows={4}
          />
        </div>

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
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? "Scheduling..." : "Schedule Site Visit"}
          </Button>
        </div>
      </form>
    </FormDrawer>
  )
}
