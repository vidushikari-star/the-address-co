"use client"

import type { Contact } from "@/types/contact"

export function getWhatsAppPhone(contact: Contact) {
  return (contact.whatsapp ?? contact.phone ?? "").replace(/\D/g, "")
}

/**
 * Opens the recipient's WhatsApp conversation in the account active on the
 * current device. WhatsApp does not provide a supported URL that starts an
 * audio/video call directly, so the advisor starts the call from that chat.
 */
export function openWhatsAppForCall(contact: Contact) {
  const phone = getWhatsAppPhone(contact)

  if (!phone || typeof window === "undefined") {
    return false
  }

  window.open(
    `https://wa.me/${phone}`,
    "_blank",
    "noopener,noreferrer"
  )

  return true
}
