import { spawn } from "node:child_process"

import { assertMarketingQaTarget, loadMarketingQaEnvironment } from "./safety.mjs"

loadMarketingQaEnvironment()
await assertMarketingQaTarget()

const baseUrl = new URL(process.env.MARKETING_QA_BASE_URL)
if (!["localhost", "127.0.0.1"].includes(baseUrl.hostname)) {
  throw new Error("Marketing QA safety check failed: the local QA launcher requires a localhost MARKETING_QA_BASE_URL")
}

const port = process.env.MARKETING_QA_APP_PORT ?? baseUrl.port
if (!/^\d{2,5}$/u.test(port ?? "")) {
  throw new Error("Marketing QA safety check failed: MARKETING_QA_APP_PORT must be a valid TCP port")
}

const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: process.env.MARKETING_QA_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.MARKETING_QA_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.MARKETING_QA_BASE_URL,
    MARKETING_ENABLED: "true",
    MARKETING_SCHEDULING_ENABLED: "false",
    INSTAGRAM_PUBLISHING_ENABLED: "false",
    // Never load local Meta/OAuth or paid generation credentials into QA.
    META_APP_ID: "",
    META_APP_SECRET: "",
    META_REDIRECT_URI: "",
    META_INSTAGRAM_OAUTH_AUTHORIZE_URL: "",
    MARKETING_OAUTH_STATE_SECRET: "",
    MARKETING_CRON_SECRET: "",
    OPENAI_API_KEY: "",
  },
})

child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
