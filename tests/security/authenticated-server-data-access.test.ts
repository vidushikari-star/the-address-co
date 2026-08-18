import { describe, expect, it, vi } from "vitest"
import { readFile, readdir } from "node:fs/promises"
import { join, relative } from "node:path"

import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { loadAuthenticatedCrmData } from "@/lib/observability/crm-server-diagnostics"

const root = process.cwd()

const clientBoundRepositoryImports = [
  "@/lib/supabase/client",
  "@/lib/repositories/activity-repository",
  "@/lib/repositories/calendar-event-repository",
  "@/lib/repositories/commission-distribution-repository",
  "@/lib/repositories/commission-repository",
  "@/lib/repositories/company-settings-repository",
  "@/lib/repositories/contact-summary-repository",
  "@/lib/repositories/contact-timeline-repository",
  "@/lib/repositories/crm-draft-repository",
  "@/lib/repositories/deal-repository",
  "@/lib/repositories/expense-repository",
  "@/lib/repositories/note-repository",
  "@/lib/repositories/property-commission-repository",
  "@/lib/repositories/property-contact-repository",
  "@/lib/repositories/property-document-repository",
  "@/lib/repositories/property-image-repository",
  "@/lib/repositories/property-repository",
  "@/lib/repositories/property-share-repository",
  "@/lib/repositories/site-visit-repository",
  "@/lib/repositories/task-repository",
  "@/lib/repositories/user-profile-repository",
  "@/lib/supabase/repositories/contacts.repository",
  "@/lib/supabase/repositories/properties.repository",
  "@/lib/supabase/repositories/contact-relationship.repository",
  "@/lib/supabase/repositories/whatsapp.repository",
]

async function filesRecursively(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory()
      ? filesRecursively(path)
      : /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  }))

  return files.flat()
}

async function authenticatedServerEntryPoints(): Promise<string[]> {
  const [pages, apiRoutes, actions, serverRepositories, services] = await Promise.all([
    filesRecursively(join(root, "app", "(app)")),
    filesRecursively(join(root, "app", "api")),
    filesRecursively(join(root, "lib", "actions")),
    filesRecursively(join(root, "lib", "repositories")),
    filesRecursively(join(root, "lib", "services")),
  ])

  const appServerFiles = (await Promise.all(pages.map(async file => ({
    file,
    source: await readFile(file, "utf8"),
  })))).filter(({ source }) => !/^\s*["']use client["']/.test(source)).map(({ file }) => file)

  const serverServices = (await Promise.all(services.map(async file => ({
    file,
    source: await readFile(file, "utf8"),
  })))).filter(({ source }) => source.includes("createServerSupabaseClient")).map(({ file }) => file)

  return [
    ...appServerFiles,
    ...apiRoutes,
    ...actions,
    ...serverRepositories.filter(file => /(^|[-/])(server|authenticated)[^/]*\.ts$/.test(file)),
    ...serverServices,
  ]
}

describe("authenticated CRM server data access", () => {
  it("marks the browser singleton as client-only so server imports fail at build time", async () => {
    const source = await readFile(join(root, "lib", "supabase", "client.ts"), "utf8")

    expect(source).toContain('import "client-only"')
    expect(source).toContain("createBrowserClient")
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
  })

  it("keeps browser-bound repositories out of authenticated server pages, routes, actions, and server repositories", async () => {
    const offenders: string[] = []

    for (const file of await authenticatedServerEntryPoints()) {
      const source = await readFile(file, "utf8")
      for (const clientImport of clientBoundRepositoryImports) {
        if (source.includes(clientImport)) offenders.push(`${relative(root, file)} -> ${clientImport}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it("uses an explicitly injected authenticated client for the previously failing CRM detail pages", async () => {
    const files = [
      "app/(app)/contacts/[id]/page.tsx",
      "app/(app)/properties/[slug]/page.tsx",
      "app/(app)/deals/[id]/page.tsx",
      "app/(app)/deals/page.tsx",
      "app/(app)/finance/page.tsx",
      "app/(app)/reports/page.tsx",
      "app/(app)/settings/users/page.tsx",
    ]

    for (const file of files) {
      const source = await readFile(join(root, file), "utf8")
      expect(source).toContain("createServerSupabaseClient")
      expect(source).toContain("createAuthenticatedCrmReadRepository")
      expect(source).not.toContain("@/lib/supabase/client")
    }
  })

  it("executes server repository reads through the injected client with no browser fallback", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ key: "timezone", value: "Asia/Kolkata" }], error: null })
    const from = vi.fn(() => ({ select }))
    const repository = createAuthenticatedCrmReadRepository({ from } as never)

    await expect(repository.getCompanySettings()).resolves.toEqual({ timezone: "Asia/Kolkata" })
    expect(from).toHaveBeenCalledWith("company_settings")
    expect(select).toHaveBeenCalledWith("key,value")
  })

  it("logs only safe context for authenticated CRM server-data failures", async () => {
    const error = Object.assign(new Error("permission denied for table contacts"), { code: "42501" })
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    await expect(loadAuthenticatedCrmData(
      { route: "/contacts/[id]", area: "contact detail", userId: "user-123" },
      async () => { throw error },
    )).rejects.toBe(error)

    expect(errorSpy).toHaveBeenCalledWith("Authenticated CRM server data load failed", {
      route: "/contacts/[id]",
      area: "contact detail",
      userId: "user-123",
      code: "42501",
      message: "CRM data query failed.",
    })
    errorSpy.mockRestore()
  })

  it("retains Stage 1 anonymous CRM restrictions and the separate token-gated public-share path", async () => {
    const [stageOne, publicShare, publicPage] = await Promise.all([
      readFile(join(root, "supabase", "migrations", "20260812090000_stage_1_remove_anonymous_crm_access.sql"), "utf8"),
      readFile(join(root, "lib", "public", "property-share.ts"), "utf8"),
      readFile(join(root, "app", "(public)", "share", "[slug]", "page.tsx"), "utf8"),
    ])

    expect(stageOne).toMatch(/revoke all on table[\s\S]*public\.contacts,[\s\S]*public\.deals,[\s\S]*public\.properties,[\s\S]*from anon;/)
    expect(publicShare).toContain("createAdminSupabaseClient")
    expect(publicShare).toContain("public_share_enabled")
    expect(publicPage).toContain("getPublicPropertyShare")
    expect(publicPage).not.toContain("@/lib/supabase/client")
  })

  it("keeps normal Housing inbox reads cookie-backed while the external bearer endpoint retains its trusted admin path", async () => {
    const [housingPage, housingEndpoint, publicShareSettingsRoute] = await Promise.all([
      readFile(join(root, "app", "(app)", "settings", "integrations", "housing", "page.tsx"), "utf8"),
      readFile(join(root, "app", "api", "integrations", "housing", "inventory", "route.ts"), "utf8"),
      readFile(join(root, "app", "api", "properties", "[id]", "public-share", "route.ts"), "utf8"),
    ])

    expect(housingPage).toContain("createServerSupabaseClient")
    expect(housingPage).not.toContain("createAdminSupabaseClient")
    expect(housingEndpoint).toContain("hasValidHousingInventoryKey")
    expect(housingEndpoint).toContain("createAdminSupabaseClient")
    expect(publicShareSettingsRoute).toContain("createServerSupabaseClient")
    expect(publicShareSettingsRoute).not.toContain("createAdminSupabaseClient")
  })
})
