import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { HousingInventoryInbox } from "@/components/settings/housing-inventory-inbox"
import type { HousingInventoryInboxRow } from "@/lib/integrations/housing/inventory"

const submission = {
  id: "b2041f1f-89e9-4a59-a8de-00169502f523",
  external_id: "HOUSING-123456",
  payload: {
    external_id: "HOUSING-123456",
    name: "Advisor Name",
    email: "advisor@example.com",
    phone: "+919876543210",
    listing_contact: {
      source: "housing_payload",
      name: "Advisor Name",
      email: "advisor@example.com",
      phone: "+919876543210",
    },
    building_or_society_name: "Casa Ekam",
    address: { locality: "Siolim", city: "Goa" },
  },
  payload_hash: "a".repeat(64),
  version: 2,
  status: "ready_for_mapping",
  validation_errors: [],
  received_at: "2026-08-18T12:00:00.000Z",
  updated_at: "2026-08-18T12:00:00.000Z",
  processed_at: null,
  crm_property_id: null,
} as unknown as HousingInventoryInboxRow

describe("HousingInventoryInbox", () => {
  it("shows the admin contact summary alongside inventory status and version", () => {
    const markup = renderToStaticMarkup(createElement(HousingInventoryInbox, {
      configured: true,
      submissions: [submission],
    }))

    expect(markup).toContain("HOUSING-123456")
    expect(markup).toContain("Casa Ekam")
    expect(markup).toContain("Advisor Name")
    expect(markup).toContain("advisor@example.com")
    expect(markup).toContain("••••••3210")
    expect(markup).toContain("Siolim, Goa")
    expect(markup).toContain("Ready for Mapping")
    expect(markup).toContain("v2")
  })
})
