import { expect, test } from "@playwright/test"

import { signInToDashboard } from "./support/auth"

test("Dashboard + New exposes all Stage 1 creation paths without creating data", async ({ page }) => {
  await signInToDashboard(page, "admin")

  const newButton = page.getByRole("button", { name: "New" })
  const creationDrawers = [
    { menuItem: "New Relationship", title: "New Relationship" },
    { menuItem: "New Property", title: "New Property" },
    { menuItem: "New Deal", title: "New Deal" },
  ]

  for (const drawer of creationDrawers) {
    await newButton.click()
    await page.getByRole("menuitem", { name: drawer.menuItem }).click()
    await expect(page.getByRole("dialog").getByText(drawer.title, { exact: true })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
  }

  await newButton.click()
  await page.getByRole("menuitem", { name: "Resume Drafts" }).click()
  await expect(page).toHaveURL(/\/drafts(?:\?.*)?$/u)
})
