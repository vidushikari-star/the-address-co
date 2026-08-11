"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

type Props = {
  shareToken: string
  propertyTitle: string
}

/**
 * The browser submits only visitor-provided data and the opaque public token.
 * The server validates that token before it writes any CRM contact/activity.
 */
export function PropertyEnquiryForm({ shareToken, propertyTitle }: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      setError("Enter your name and phone number to request a viewing.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/public/property-shares/${encodeURIComponent(shareToken)}/enquiries`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, phone, email, message }),
        },
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error ?? "Unable to submit your enquiry.")
      }

      setSubmitted(true)
    } catch (submissionError) {
      console.error("Public property enquiry failed", submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your enquiry. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border p-8 text-center">
        <h3 className="text-2xl font-semibold">Thank you</h3>
        <p className="mt-3 text-muted-foreground">
          We will get back to you shortly regarding {propertyTitle}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-3xl border p-8">
      <h2 className="text-3xl font-semibold">Schedule a Private Viewing</h2>

      <input
        type="text"
        autoComplete="name"
        required
        className="w-full rounded-xl border p-3"
        placeholder="Your Name"
        value={name}
        onChange={event => setName(event.target.value)}
      />

      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        className="w-full rounded-xl border p-3"
        placeholder="Phone Number"
        value={phone}
        onChange={event => setPhone(event.target.value)}
      />

      <input
        type="email"
        autoComplete="email"
        className="w-full rounded-xl border p-3"
        placeholder="Email"
        value={email}
        onChange={event => setEmail(event.target.value)}
      />

      <textarea
        className="w-full rounded-xl border p-3"
        placeholder="Message"
        rows={4}
        value={message}
        onChange={event => setMessage(event.target.value)}
      />

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Button className="w-full" disabled={loading} onClick={submit}>
        {loading ? "Submitting..." : "Request Private Viewing"}
      </Button>
    </div>
  )
}
