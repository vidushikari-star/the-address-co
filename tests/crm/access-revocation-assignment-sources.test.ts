import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()

const newAssignmentSources = [
  "components/contacts/[id]/edit/page.tsx",
  "components/dashboard/follow-up-queue.tsx",
  "components/tasks/create-task-dialog.tsx",
  "components/tasks/edit-task-dialog.tsx",
  "components/contacts/detail/relationship-tasks.tsx",
  "components/deals/deal-tasks.tsx",
  "components/deals/site-visit-drawer.tsx",
  "components/deals/edit-site-visit-dialog.tsx",
  "components/forms/edit-deal-drawer.tsx",
  "components/forms/deal-drawer.tsx",
  "components/finance/add-distribution-drawer.tsx",
  "app/(app)/deals/new/page.tsx",
]

describe("new CRM assignment sources", () => {
  it("uses the active-profile helper for every audited assignment control", async () => {
    for (const path of newAssignmentSources) {
      const source = await readFile(join(root, path), "utf8")
      expect(source).toContain("getActiveAssignableUserProfiles")
    }
  })

  it("removes the sales-only new-deal filter and static advisor dependency", async () => {
    const [newDeal, dealTasks, commissionEdit] = await Promise.all([
      readFile(join(root, "app/(app)/deals/new/page.tsx"), "utf8"),
      readFile(join(root, "components/deals/deal-tasks.tsx"), "utf8"),
      readFile(join(root, "app/(app)/commissions/[id]/edit/page.tsx"), "utf8"),
    ])

    expect(newDeal).toContain("getActiveAssignableUserProfiles()")
    expect(newDeal).not.toMatch(/\.eq\(\s*["']role["']\s*,\s*["']sales["']\s*\)/)
    expect(dealTasks).toContain("getActiveAssignableUserProfiles()")
    expect(dealTasks).not.toContain("ADVISORS")
    expect(commissionEdit).toContain("getServerActiveAssignableUserProfiles()")
  })

  it("keeps historical profile lookups by referenced ID rather than filtering them by active state", async () => {
    const [siteVisits, tasks, distributions] = await Promise.all([
      readFile(join(root, "lib/repositories/site-visit-repository.ts"), "utf8"),
      readFile(join(root, "lib/repositories/task-repository.ts"), "utf8"),
      readFile(join(root, "lib/repositories/commission-distribution-repository.ts"), "utf8"),
    ])

    expect(siteVisits).toContain('.in(\n          "id",\n          advisorIds')
    expect(tasks).toContain('.in("id", advisorIds)')
    expect(distributions).toContain("user:user_profiles")
    expect(siteVisits).not.toContain('eq("is_active", true)')
    expect(tasks).not.toContain('eq("is_active", true)')
  })
})
