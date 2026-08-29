import { afterEach, describe, expect, it } from "vitest"

import { isInstagramPublishingEnabled, isMarketingEnabled, isMarketingSchedulingEnabled } from "@/lib/marketing/feature-flags"

const initialMarketing = process.env.MARKETING_ENABLED
const initialPublishing = process.env.INSTAGRAM_PUBLISHING_ENABLED
const initialScheduling = process.env.MARKETING_SCHEDULING_ENABLED

function restore(name: "MARKETING_ENABLED" | "INSTAGRAM_PUBLISHING_ENABLED" | "MARKETING_SCHEDULING_ENABLED", value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

afterEach(() => {
  restore("MARKETING_ENABLED", initialMarketing)
  restore("INSTAGRAM_PUBLISHING_ENABLED", initialPublishing)
  restore("MARKETING_SCHEDULING_ENABLED", initialScheduling)
})

describe("Marketing feature flags", () => {
  it("keeps Marketing and Instagram publishing opt-in", () => {
    delete process.env.MARKETING_ENABLED
    delete process.env.INSTAGRAM_PUBLISHING_ENABLED

    expect(isMarketingEnabled()).toBe(false)
    expect(isInstagramPublishingEnabled()).toBe(false)
  })

  it("keeps scheduling available unless the explicit QA safety switch disables it", () => {
    delete process.env.MARKETING_SCHEDULING_ENABLED
    expect(isMarketingSchedulingEnabled()).toBe(true)

    process.env.MARKETING_SCHEDULING_ENABLED = "false"
    expect(isMarketingSchedulingEnabled()).toBe(false)
  })
})
