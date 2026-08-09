"use client"

import {
  useState,
  type ComponentProps,
  type FormEvent,
  type MouseEvent,
} from "react"
import { Phone } from "lucide-react"

import { FormDrawer } from "@/components/forms/form-drawer"
import { Button } from "@/components/ui/button"
import {
  getWhatsAppPhone,
  openWhatsAppForCall,
} from "@/lib/communications/whatsapp-call"
import { createActivity } from "@/lib/repositories/activity-repository"
import type { Contact } from "@/types/contact"

type CallOutcome =
  | "connected"
  | "follow_up"
  | "no_answer"
  | "not_interested"
  | "other"

const outcomes: Array<{
  value: CallOutcome
  label: string
}> = [
  { value: "connected", label: "Connected" },
  { value: "follow_up", label: "Follow-up requested" },
  { value: "no_answer", label: "No answer" },
  { value: "not_interested", label: "Not interested" },
  { value: "other", label: "Other" },
]

type ButtonProps = ComponentProps<typeof Button>

type WhatsAppCallButtonProps = {
  contact: Contact
  className?: string
  variant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
  disabled?: boolean
  stopPropagation?: boolean
}

export function WhatsAppCallButton({
  contact,
  className,
  variant = "outline",
  size = "sm",
  disabled = false,
  stopPropagation = false,
}: WhatsAppCallButtonProps) {
  const [open, setOpen] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)

  const phone = getWhatsAppPhone(contact)

  if (!phone) {
    return null
  }

  function startCall(event: MouseEvent<HTMLButtonElement>) {
    if (stopPropagation) {
      event.stopPropagation()
    }

    const callStartedAt = new Date().toISOString()

    if (openWhatsAppForCall(contact)) {
      setStartedAt(callStartedAt)
      setOpen(true)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={startCall}
      >
        <Phone className="size-4" />
        WhatsApp Call
      </Button>

      <WhatsAppCallLogDrawer
        open={open}
        onOpenChange={setOpen}
        contact={contact}
        startedAt={startedAt}
      />
    </>
  )
}

type WhatsAppCallLogDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact
  startedAt: string | null
}

function WhatsAppCallLogDrawer({
  open,
  onOpenChange,
  contact,
  startedAt,
}: WhatsAppCallLogDrawerProps) {
  const [outcome, setOutcome] = useState<CallOutcome>("connected")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [notes, setNotes] = useState("")
  const [nextFollowUpAt, setNextFollowUpAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outcomeLabel = outcomes.find(item => item.value === outcome)?.label

  function reset() {
    setOutcome("connected")
    setDurationMinutes("")
    setNotes("")
    setNextFollowUpAt("")
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && loading) {
      return
    }

    if (!nextOpen) {
      reset()
    }

    onOpenChange(nextOpen)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const duration = durationMinutes.trim()
      ? Number(durationMinutes)
      : undefined

    if (
      duration !== undefined &&
      (!Number.isInteger(duration) || duration < 0 || duration > 720)
    ) {
      setError("Enter a whole number of minutes between 0 and 720.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const details = [
        `Outcome: ${outcomeLabel ?? "Other"}.`,
        duration !== undefined
          ? `Duration: ${duration} minute${duration === 1 ? "" : "s"}.`
          : null,
        notes.trim() || null,
      ].filter(Boolean)

      await createActivity({
        type: "call",
        title: `WhatsApp call — ${outcomeLabel ?? "Other"}`,
        body: details.join("\n"),
        contactId: contact.id,
        date: startedAt ?? new Date().toISOString(),
        nextFollowUpAt: nextFollowUpAt
          ? new Date(nextFollowUpAt).toISOString()
          : undefined,
      })

      reset()
      onOpenChange(false)
    } catch (submitError) {
      console.error("Unable to log WhatsApp call", submitError)
      setError("Unable to save the call log. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Log WhatsApp call"
      description={`WhatsApp opened separately for ${contact.name}. Add the outcome when you return.`}
    >
      <form onSubmit={submit} className="space-y-5 pt-5">
        <label className="block space-y-2 text-sm font-medium">
          Outcome
          <select
            value={outcome}
            onChange={event => setOutcome(event.target.value as CallOutcome)}
            className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          >
            {outcomes.map(item => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Duration in minutes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            type="number"
            min="0"
            max="720"
            step="1"
            inputMode="numeric"
            value={durationMinutes}
            onChange={event => setDurationMinutes(event.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
            placeholder="For example, 12"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            className="min-h-28 w-full resize-y rounded-lg border bg-background p-3 font-normal"
            placeholder="Key requirements, objections, or the agreed next step"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Next follow-up{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={event => setNextFollowUpAt(event.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleOpenChange(false)}
          >
            Skip logging
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving…" : "Save call log"}
          </Button>
        </div>
      </form>
    </FormDrawer>
  )
}
