import { readFile } from "node:fs/promises"
import { join } from "node:path"

import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  getDashboardStats,
  getDealHealthSummary,
  getFollowUpContacts,
  getHotLeads,
  getMyWork,
  getRecentActivities,
  getUpcomingTasks,
} from "@/lib/services/dashboard-service"

import {
  getCommissionStats,
} from "@/lib/services/commission-service"

import {
  loadRequiredDashboardData,
  loadOptionalDashboardWidget,
} from "@/lib/services/dashboard-widget-loader"

import type {
  DashboardSupabaseClient,
} from "@/lib/services/dashboard-service"

import type {
  UserProfile,
} from "@/types/user"

const root = process.cwd()

function createQuery(
  result: Record<string, unknown>
) {
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    not: vi.fn(),
    then: undefined as unknown,
  }

  for (const method of [
    query.select,
    query.order,
    query.limit,
    query.eq,
    query.neq,
    query.gte,
    query.lte,
    query.not,
  ]) {
    method.mockReturnValue(query)
  }

  query.then = (
    onfulfilled: (value: Record<string, unknown>) => unknown,
    onrejected: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(onfulfilled, onrejected)

  return query
}

function createAuthenticatedDashboardClient(
  responses: Record<string, Record<string, unknown>> = {}
) {
  const from = vi.fn((table: string) => {
    void table

    return createQuery({
      data: [],
      count: 0,
      error: null,
      ...responses[table],
    })
  })

  return {
    client: {
      from,
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "advisor-1",
            },
          },
          error: null,
        }),
      },
    } as unknown as DashboardSupabaseClient,
    from,
  }
}

describe("Dashboard authenticated CRM reads", () => {
  it("uses the request-scoped authenticated client for every server-rendered Dashboard query", async () => {
    const {
      client: supabase,
      from,
    } = createAuthenticatedDashboardClient()

    await Promise.all([
      getDashboardStats(supabase),
      getRecentActivities(supabase),
      getUpcomingTasks(supabase),
      getHotLeads(supabase),
      getMyWork(supabase, "advisor-1"),
      getDealHealthSummary(supabase),
      getFollowUpContacts(supabase),
      getCommissionStats(
        supabase,
        "admin" as UserProfile["role"]
      ),
    ])

    const tables = from.mock.calls.map(
      ([table]: [string]) => table
    )

    expect(tables).toEqual(
      expect.arrayContaining([
        "contacts",
        "properties",
        "deals",
        "activities",
        "tasks",
        "site_visits",
        "commissions",
      ])
    )
  })

  it("loads authenticated contact data, zero contacts, and missing optional profiles without crashing", async () => {
    const contact = {
      id: "contact-1",
      first_name: "Asha",
      last_name: null,
      full_name: "Asha Rao",
      phone: "+91 9000000000",
      email: null,
      whatsapp: null,
      advisor_id: null,
      advisor: null,
      created_at: "2026-08-18T00:00:00.000Z",
      updated_at: "2026-08-18T00:00:00.000Z",
      last_activity_at: null,
      relationship_types: [],
      lead_stage: "new",
      lead_temperature: "warm",
    }

    const {
      client: contactClient,
    } = createAuthenticatedDashboardClient({
      contacts: {
        data: [contact],
      },
    })

    await expect(
      getDashboardStats(contactClient)
    ).resolves.toMatchObject({
      contactsCount: 1,
      activeContactsCount: 1,
      contacts: [
        {
          id: "contact-1",
          assignedAdvisor: undefined,
        },
      ],
    })

    const { client: supabase } =
      createAuthenticatedDashboardClient()

    const stats = await getDashboardStats(supabase)

    expect(stats).toMatchObject({
      contactsCount: 0,
      activeContactsCount: 0,
      openDealsCount: 0,
      propertiesCount: 0,
    })
  })

  it("keeps optional widget failures isolated while rethrowing authorization failures", async () => {
    const error = vi.spyOn(console, "error")
      .mockImplementation(() => undefined)

    await expect(
      loadOptionalDashboardWidget(
        "agenda",
        "advisor-1",
        async () => {
          throw new Error("temporary database failure")
        },
        () => [] as string[]
      )
    ).resolves.toEqual([])

    await expect(
      loadOptionalDashboardWidget(
        "follow-up-queue",
        "advisor-1",
        async () => {
          throw {
            code: "42501",
            message: "permission denied for table contacts",
          }
        },
        () => [] as string[]
      )
    ).rejects.toMatchObject({
      code: "42501",
    })

    expect(error).toHaveBeenCalledWith(
      "Dashboard widget loader failed",
      expect.objectContaining({
        area: "follow-up-queue",
        code: "42501",
        message: "Dashboard widget request failed.",
        userId: "advisor-1",
      })
    )

    error.mockRestore()
  })

  it("logs and rethrows failures from the required summary loader", async () => {
    const error = vi.spyOn(console, "error")
      .mockImplementation(() => undefined)

    const failure = {
      code: "42501",
      message: "permission denied for table contacts",
    }

    await expect(
      loadRequiredDashboardData(
        "summary",
        "advisor-1",
        async () => {
          throw failure
        }
      )
    ).rejects.toBe(failure)

    expect(error).toHaveBeenCalledWith(
      "Dashboard widget loader failed",
      expect.objectContaining({
        area: "summary",
        code: "42501",
        message: "Dashboard widget request failed.",
        userId: "advisor-1",
      })
    )

    error.mockRestore()
  })

  it("keeps Dashboard server code on the cookie-backed client and leaves anon contacts blocked", async () => {
    const [
      dashboardService,
      dashboardPage,
      stageOneMigration,
      browserClient,
    ] = await Promise.all([
      readFile(join(root, "lib", "services", "dashboard-service.ts"), "utf8"),
      readFile(join(root, "app", "(app)", "dashboard", "page.tsx"), "utf8"),
      readFile(join(root, "supabase", "migrations", "20260812090000_stage_1_remove_anonymous_crm_access.sql"), "utf8"),
      readFile(join(root, "lib", "supabase", "client.ts"), "utf8"),
    ])

    expect(dashboardService).toContain("createServerSupabaseClient")
    expect(dashboardService).not.toContain('from "@/lib/supabase/client"')
    expect(dashboardService).not.toContain("ContactsRepository")
    expect(dashboardPage).toContain("createServerSupabaseClient")
    expect(dashboardPage).toContain('export const dynamic = "force-dynamic"')
    expect(stageOneMigration).toContain("public.contacts")
    expect(stageOneMigration).toContain("from anon;")
    expect(stageOneMigration).not.toMatch(/grant\s+select\s+on\s+table\s+public\.contacts\s+to\s+anon/i)
    expect(browserClient).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
  })
})
