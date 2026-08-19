import { expect, test } from "@playwright/test"

import { signIn, signInToDashboard } from "./support/auth"
import { getE2eEnvironment } from "./support/env"

test.describe("Stage 1 authenticated-browser and authorization boundaries", () => {
  test("admin can authenticate and reach the CRM dashboard", async ({ page }) => {
    await signInToDashboard(page, "admin")
  })

  test("sales can authenticate and reach the CRM dashboard", async ({ page }) => {
    await signInToDashboard(page, "sales")
  })

  test("an authenticated user without a CRM profile cannot reach the dashboard", async ({ page }) => {
    await signIn(page, "unprofiled")
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/u)
  })

  test("anonymous API calls cannot access protected Stage 1 CRM tables", async () => {
    const { anonKey, supabaseUrl } = getE2eEnvironment()
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` }

    for (const table of ["activities", "deals", "properties", "site_visits", "user_profiles"]) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=id&limit=1`, { headers })
      expect(response.status, `${table} must reject anonymous reads`).toBeGreaterThanOrEqual(400)
    }
  })

  test("the intentional anonymous property-image read remains available", async () => {
    const { anonKey, supabaseUrl } = getE2eEnvironment()
    const response = await fetch(`${supabaseUrl}/rest/v1/property_images?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    expect(response.status).toBe(200)
  })
})
