import { expect, type Page } from "@playwright/test"

import { getE2eEnvironment, type E2eRole } from "./env"

export async function signIn(page: Page, role: E2eRole) {
  const { credentials } = getE2eEnvironment()
  const user = credentials[role]

  await page.goto("/login")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Login" }).click()
}

export async function signInToDashboard(page: Page, role: Extract<E2eRole, "admin" | "sales">) {
  await signIn(page, role)
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/u)
}
