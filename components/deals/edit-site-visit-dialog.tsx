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
import { updateSiteVisit } from "@/lib/repositories/site-visit-repository"

import type { SiteVisit } from "@/types/site-visit"

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDate(visit.scheduledDate)
      setTime(visit.scheduledTime)
      setNotes(visit.notes ?? "")
      setError(null)
    }
  }, [open, visit])

  async function save(event: React.FormEvent) {
    event.preventDefault()

    if (!date || !time) {
      setError("Visit date and time are required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateSiteVisit(visit.id, {
        scheduledDate: date,
        scheduledTime: time,
        notes: notes.trim() || undefined,
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
              Update the scheduled time or visit notes.
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
