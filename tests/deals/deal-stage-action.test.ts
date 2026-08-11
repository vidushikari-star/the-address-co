import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ getServerUserProfile: vi.fn() }))
const server = vi.hoisted(() => ({ rpc: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/server-user-profile", () => auth)
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn().mockResolvedValue(server) }))
vi.mock("next/cache", () => cache)

import { transitionDealStageAction } from "@/lib/actions/deal-actions"

beforeEach(() => {
  vi.clearAllMocks()
  auth.getServerUserProfile.mockResolvedValue({ id: "advisor-1", role: "sales" })
  server.rpc.mockResolvedValue({ data: [{ changed: true }], error: null })
})

describe("transitionDealStageAction", () => {
  it("requires an authenticated CRM user before calling the transaction", async () => {
    auth.getServerUserProfile.mockResolvedValue(null)

    await expect(transitionDealStageAction({ dealId: "deal-1", stage: "negotiation" })).resolves.toEqual({
      ok: false,
      error: "You do not have permission to update this deal.",
    })
    expect(server.rpc).not.toHaveBeenCalled()
  })

  it("uses the atomic stage-and-activity RPC then refreshes related views", async () => {
    await expect(transitionDealStageAction({
      dealId: "deal-1",
      stage: "negotiation",
      contactId: "contact-1",
    })).resolves.toEqual({ ok: true, changed: true })

    expect(server.rpc).toHaveBeenCalledWith("transition_deal_stage", {
      p_deal_id: "deal-1",
      p_stage: "negotiation",
    })
    expect(cache.revalidatePath).toHaveBeenCalledWith("/deals")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/deals/deal-1")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/contacts/contact-1")
  })

  it("does not expose a database error to the deal screen", async () => {
    server.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "row-level security policy" } })
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    await expect(transitionDealStageAction({ dealId: "deal-1", stage: "negotiation" })).resolves.toEqual({
      ok: false,
      error: "The deal stage could not be saved. Refresh and try again.",
    })
    expect(errorSpy).toHaveBeenCalledWith("Deal stage transition failed", { code: "42501" })
    errorSpy.mockRestore()
  })
})
