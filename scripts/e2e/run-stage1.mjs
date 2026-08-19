import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { loadE2eEnvironment, assertDisposableE2eTarget } from "./safety.mjs"

loadE2eEnvironment()
if (!process.env.E2E_RUN_ID) {
  process.env.E2E_RUN_ID = `stage1-${randomUUID().slice(0, 12)}`
}

await assertDisposableE2eTarget()

const child = spawn(
  process.execPath,
  ["./node_modules/@playwright/test/cli.js", "test", "--config=playwright.config.ts", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env }
)

child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
