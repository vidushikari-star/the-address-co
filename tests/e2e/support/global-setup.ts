import { assertDisposableE2eTarget, loadE2eEnvironment } from "../../../scripts/e2e/safety.mjs"
import { provisionE2eUsers } from "./provision-users"

export default async function globalSetup() {
  loadE2eEnvironment()
  await assertDisposableE2eTarget()
  await provisionE2eUsers()
}
