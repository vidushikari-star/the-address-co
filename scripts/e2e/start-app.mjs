import { spawn } from "node:child_process"
import { loadE2eEnvironment, assertDisposableE2eTarget } from "./safety.mjs"

loadE2eEnvironment()
await assertDisposableE2eTarget()

if (process.env.E2E_START_LOCAL_APP !== "true") {
  throw new Error("E2E safety check failed: E2E_START_LOCAL_APP must be true to start the local app")
}

const baseUrl = new URL(process.env.E2E_BASE_URL)
if (!["localhost", "127.0.0.1"].includes(baseUrl.hostname)) {
  throw new Error("E2E safety check failed: local app startup requires a localhost E2E_BASE_URL")
}

const port = process.env.E2E_APP_PORT ?? baseUrl.port
if (!/^\d{2,5}$/u.test(port ?? "")) {
  throw new Error("E2E safety check failed: E2E_APP_PORT must be a valid TCP port")
}

const appEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.E2E_BASE_URL,
  MARKETING_ENABLED: "false",
  INSTAGRAM_PUBLISHING_ENABLED: "false",
}

const child = spawn(
  process.execPath,
  ["./node_modules/next/dist/bin/next", "dev", "--port", port],
  { stdio: "inherit", env: appEnv }
)

child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
