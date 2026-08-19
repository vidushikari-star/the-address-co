import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("Dashboard + New workflow", () => {
  it("opens the three creation workflows in drawers instead of navigating to standalone forms", async () => {
    const [header, provider, draftsPage] = await Promise.all([
      readFile(join(root, "components", "app", "app-header.tsx"), "utf8"),
      readFile(join(root, "components", "providers", "drawer-provider.tsx"), "utf8"),
      readFile(join(root, "app", "(app)", "drafts", "page.tsx"), "utf8"),
    ])

    expect(header).toContain('openDrawer("relationship")')
    expect(header).toContain('openDrawer("property")')
    expect(header).toContain('openDrawer("deal")')
    expect(header).not.toContain('router.push("/properties/new")')
    expect(header).not.toContain('router.push("/deals/new")')
    expect(provider).toContain('drawer === "relationship"')
    expect(provider).toContain('drawer === "property"')
    expect(provider).toContain('drawer === "deal"')
    expect(provider).toContain('searchParams.get("new")')
    expect(draftsPage).toContain('href: "/dashboard?new=property"')
    expect(draftsPage).toContain('href: "/dashboard?new=relationship"')
    expect(draftsPage).toContain('href: "/dashboard?new=deal"')
  })

  it("keeps the original property media and source workflow while adding drafts", async () => {
    const propertyDrawer = await readFile(join(root, "components", "forms", "property-drawer.tsx"), "utf8")

    expect(propertyDrawer).toContain("uploadPropertyImage")
    expect(propertyDrawer).toContain("uploadPropertyDocument")
    expect(propertyDrawer).toContain("Property Source & Commission")
    expect(propertyDrawer).toContain('saveCrmDraft("property"')
    expect(propertyDrawer).toContain('getCrmDraft("property")')
    expect(propertyDrawer).toContain('deleteCrmDraft("property")')
    expect(propertyDrawer).toContain("__propertySources")
    expect(propertyDrawer).toContain('type="button"')
    expect(propertyDrawer).toContain("Save Draft")
  })

  it("keeps deal and relationship drafts in their drawer creation flows", async () => {
    const [dealDrawer, relationshipDrawer, relationshipForm] = await Promise.all([
      readFile(join(root, "components", "forms", "deal-drawer.tsx"), "utf8"),
      readFile(join(root, "components", "forms", "relationship-drawer.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "relationship-form.tsx"), "utf8"),
    ])

    expect(dealDrawer).toContain('saveCrmDraft("deal"')
    expect(dealDrawer).toContain('getCrmDraft("deal")')
    expect(dealDrawer).toContain('deleteCrmDraft("deal")')
    expect(relationshipDrawer).toContain("RelationshipForm")
    expect(relationshipForm).toContain('saveCrmDraft("relationship"')
    expect(relationshipForm).toContain('getCrmDraft("relationship")')
    expect(relationshipForm).toContain('deleteCrmDraft("relationship")')
    expect(relationshipForm).toContain("onCancel")
  })
})
