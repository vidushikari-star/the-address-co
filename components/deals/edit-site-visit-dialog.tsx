"use client"

import {
  useEffect,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import { getProperties } from "@/lib/repositories/property-repository"
import { updateSiteVisitWithActivity } from "@/lib/services/site-visit-workflow"
import { supabase } from "@/lib/supabase/client"

import type { Contact } from "@/types/contact"
import type { Property } from "@/types/property"
import type { SiteVisit } from "@/types/site-visit"

type Advisor = {
  id: string
  name: string
}

type Props = {
  visit: SiteVisit
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function EditSiteVisitDialog({
  visit,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const [date, setDate] = useState(visit.scheduledDate)
  const [time, setTime] = useState(visit.scheduledTime)
  const [notes, setNotes] = useState(visit.notes ?? "")
  const [contactId, setContactId] = useState(visit.contactId)
  const [propertyId, setPropertyId] = useState(visit.propertyId)
  const [advisorId, setAdvisorId] = useState(visit.advisorId ?? "")
  const [status, setStatus] = useState(visit.status)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDate(visit.scheduledDate)
      setTime(visit.scheduledTime)
      setNotes(visit.notes ?? "")
      setContactId(visit.contactId)
      setPropertyId(visit.propertyId)
      setAdvisorId(visit.advisorId ?? "")
      setStatus(visit.status)
      setError(null)

      Promise.all([
        ContactsRepository.getAll(),
        getProperties(),
        supabase.from("user_profiles").select("id,name").order("name"),
      ])
        .then(([contactRows, propertyRows, advisorResult]) => {
          setContacts(contactRows)
          setProperties(propertyRows)
          setAdvisors(advisorResult.data ?? [])
        })
        .catch((loadError) => {
          console.error("Unable to load site visit options", loadError)
          setError("Unable to load visit options. Please try again.")
        })
    }
  }, [open, visit])

  async function save(event: React.FormEvent) {
    event.preventDefault()

    if (!date || !time || !contactId || !propertyId || !advisorId) {
      setError("A contact, property, assigned advisor, date, and time are required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateSiteVisitWithActivity(visit, {
        scheduledDate: date,
        scheduledTime: time,
        contactId,
        propertyId,
        advisorId,
        status,
        notes: notes.trim(),
        activityDescription: properties.find((property) => property.id === propertyId)?.name ?? "Property",
      })

      onOpenChange(false)
      onUpdated?.()
    } catch (error) {
      console.error("Unable to update site visit", error)
      setError("Unable to save the site visit. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <form onSubmit={save}>
          <DialogHeader className="p-5 pr-12">
            <DialogTitle>Edit Site Visit</DialogTitle>
            <DialogDescription>
              Keep the visit schedule, assignee, property, and contact in sync.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pb-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor={`site-visit-${visit.id}-date`}
                  className="text-sm font-medium"
                >
                  Visit date <span className="text-destructive">*</span>
                </label>
                <Input
                  id={`site-visit-${visit.id}-date`}
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`site-visit-${visit.id}-time`}
                  className="text-sm font-medium"
                >
                  Visit time <span className="text-destructive">*</span>
                </label>
                <Input
                  id={`site-visit-${visit.id}-time`}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`site-visit-${visit.id}-contact`}
                className="text-sm font-medium"
              >
                Contact <span className="text-destructive">*</span>
              </label>
              <select
                id={`site-visit-${visit.id}-contact`}
                className="w-full rounded-lg border bg-background p-3"
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                required
              >
                <option value="">Select contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`site-visit-${visit.id}-property`}
                className="text-sm font-medium"
              >
                Property <span className="text-destructive">*</span>
              </label>
              <select
                id={`site-visit-${visit.id}-property`}
                className="w-full rounded-lg border bg-background p-3"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
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
                  htmlFor={`site-visit-${visit.id}-advisor`}
                  className="text-sm font-medium"
                >
                  Assigned advisor <span className="text-destructive">*</span>
                </label>
                <select
                  id={`site-visit-${visit.id}-advisor`}
                  className="w-full rounded-lg border bg-background p-3"
                  value={advisorId}
                  onChange={(event) => setAdvisorId(event.target.value)}
                  required
                >
                  <option value="">Select advisor</option>
                  {advisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`site-visit-${visit.id}-status`}
                  className="text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id={`site-visit-${visit.id}-status`}
                  className="w-full rounded-lg border bg-background p-3"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as SiteVisit["status"])}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`site-visit-${visit.id}-notes`}
                className="text-sm font-medium"
              >
                Notes
              </label>
              <Textarea
                id={`site-visit-${visit.id}-notes`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Feedback, access instructions, or attendees"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
