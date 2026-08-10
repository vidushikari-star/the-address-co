import { execFile } from "node:child_process"
import { dirname, join } from "node:path"
import { promisify } from "node:util"

import { RENDER_JOB_TYPES, MarketingWorkerService } from "@/lib/marketing/services/marketing-worker-service"
import { supabaseProjectRef } from "@/lib/marketing/supabase-project"

const execFileAsync = promisify(execFile)
const DEFAULT_INTERVAL_MS = 60_000
const MIN_INTERVAL_MS = 10_000
const RENDER_BATCH_SIZE = 1

type WorkerConfig = {
  runnerUrl: string
  cronSecret: string
  intervalMs: number
  ffmpegPath: string
  supabaseProjectRef: string
}

let stopping = false
let wakeSleep: (() => void) | null = null
let remoteProjectVerified = false

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for the Railway Marketing worker.`)
  return value
}

function interval() {
  const configured = process.env.WORKER_INTERVAL_MS
  if (!configured) return DEFAULT_INTERVAL_MS
  const value = Number(configured)
  if (!Number.isSafeInteger(value) || value < MIN_INTERVAL_MS) {
    throw new Error(`WORKER_INTERVAL_MS must be an integer of at least ${MIN_INTERVAL_MS}.`)
  }
  return value
}

function readConfig(): WorkerConfig {
  const configuredRunnerUrl = required("MARKETING_JOB_RUNNER_URL")
  let runnerUrl: URL
  try {
    runnerUrl = new URL(configuredRunnerUrl)
  } catch {
    throw new Error("MARKETING_JOB_RUNNER_URL must be a valid HTTPS URL.")
  }
  if (runnerUrl.protocol !== "https:") {
    throw new Error("MARKETING_JOB_RUNNER_URL must use HTTPS.")
  }

  // Render jobs use the existing Supabase queue directly, so these are the
  // only additional credentials genuinely required by this process.
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL")
  required("SUPABASE_SERVICE_ROLE_KEY")
  const projectRef = supabaseProjectRef(supabaseUrl)
  if (!projectRef) throw new Error("NEXT_PUBLIC_SUPABASE_URL must identify a valid Supabase project.")

  return {
    runnerUrl: runnerUrl.toString(),
    cronSecret: required("MARKETING_CRON_SECRET"),
    intervalMs: interval(),
    ffmpegPath: process.env.FFMPEG_PATH?.trim() || "ffmpeg",
    supabaseProjectRef: projectRef,
  }
}

function safeStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  return /^(MARKETING_|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|WORKER_INTERVAL_MS)/.test(message)
    ? message
    : "Check required worker configuration and FFmpeg."
}

async function verifyFfmpeg(path: string) {
  const { stdout } = await execFileAsync(path, ["-version"], {
    timeout: 10_000,
    windowsHide: true,
  })
  const version = stdout.split("\n", 1)[0]?.trim() || "version detected"
  console.info(`[marketing-worker] FFmpeg detected: ${version}`)

  const ffprobe = process.env.FFPROBE_PATH?.trim() || (path.includes("/") ? join(dirname(path), "ffprobe") : "ffprobe")
  const { stdout: probeStdout } = await execFileAsync(ffprobe, ["-version"], {
    timeout: 10_000,
    windowsHide: true,
  })
  const probeVersion = probeStdout.split("\n", 1)[0]?.trim() || "version detected"
  console.info(`[marketing-worker] FFprobe detected: ${probeVersion}`)
}

function resultSummary(result: Array<{ status: string }>) {
  return result.reduce<Record<string, number>>((summary, item) => {
    summary[item.status] = (summary[item.status] ?? 0) + 1
    return summary
  }, {})
}

async function runRenderJobs() {
  const result = await MarketingWorkerService.run(RENDER_BATCH_SIZE, {
    jobTypes: RENDER_JOB_TYPES,
    diagnosticsLabel: "Railway render",
  })
  console.info(`[marketing-worker] render jobs processed: ${JSON.stringify(resultSummary(result))}`)
}

async function invokeRemoteRunner(config: WorkerConfig) {
  const response = await fetch(config.runnerUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.cronSecret}` },
    redirect: "error",
    signal: AbortSignal.timeout(45_000),
  })
  const payload = await response.json().catch(() => null) as { result?: unknown; supabaseProjectRef?: unknown } | null
  const processed = Array.isArray(payload?.result) ? payload.result.length : undefined
  const suffix = processed === undefined ? "" : ` jobs_processed=${processed}`
  console.info(`[marketing-worker] job runner response status=${response.status}${suffix}`)

  if (response.status === 401 || response.status === 403) {
    console.error("[marketing-worker] job runner authentication failed. Check MARKETING_CRON_SECRET and endpoint access.")
    return false
  }
  if (!response.ok) {
    console.warn(`[marketing-worker] temporary job runner error (HTTP ${response.status}); retrying next cycle.`)
    return remoteProjectVerified
  }

  const remoteProjectRef = typeof payload?.supabaseProjectRef === "string" ? payload.supabaseProjectRef : null
  if (!remoteProjectRef) {
    console.error("[marketing-worker] Vercel runner did not return its Supabase project identity; render jobs will not be claimed.")
    return false
  }
  if (remoteProjectRef !== config.supabaseProjectRef) {
    console.error("[marketing-worker] Supabase project mismatch between Railway and Vercel; render jobs will not be claimed.")
    return false
  }
  if (!remoteProjectVerified) {
    console.info("[marketing-worker] Railway and Vercel Supabase project identities match.")
    remoteProjectVerified = true
  }
  return true
}

async function cycle(config: WorkerConfig) {
  console.info("[marketing-worker] job cycle started")
  let queueIdentityConfirmed = remoteProjectVerified
  if (!stopping) {
    try {
      queueIdentityConfirmed = await invokeRemoteRunner(config)
    } catch {
      console.warn("[marketing-worker] temporary job runner network error; retrying next cycle.")
    }
  }
  if (queueIdentityConfirmed && !stopping) {
    try {
      await runRenderJobs()
    } catch {
      console.warn("[marketing-worker] temporary render-worker error; retrying next cycle.")
    }
  } else if (!stopping) {
    console.warn("[marketing-worker] render job claim skipped until the shared Supabase project is confirmed.")
  }
  console.info("[marketing-worker] cycle completed")
}

function wait(ms: number) {
  return new Promise<void>(resolve => {
    const timer = setTimeout(() => {
      wakeSleep = null
      resolve()
    }, ms)
    wakeSleep = () => {
      clearTimeout(timer)
      wakeSleep = null
      resolve()
    }
  })
}

function requestShutdown(signal: "SIGINT" | "SIGTERM") {
  if (stopping) return
  stopping = true
  console.info(`[marketing-worker] ${signal} received; finishing the current cycle before shutdown.`)
  wakeSleep?.()
}

async function main() {
  const config = readConfig()
  console.info(`[marketing-worker] Marketing worker starting (interval_ms=${config.intervalMs})`)
  await verifyFfmpeg(config.ffmpegPath)
  console.info("[marketing-worker] render jobs run locally; non-render jobs are delegated to the protected Vercel runner.")

  process.once("SIGINT", () => requestShutdown("SIGINT"))
  process.once("SIGTERM", () => requestShutdown("SIGTERM"))

  while (!stopping) {
    await cycle(config)
    if (!stopping) await wait(config.intervalMs)
  }
  console.info("[marketing-worker] Marketing worker stopped")
}

main().catch(error => {
  // Do not print unknown thrown values: HTTP/client errors can include
  // sensitive URLs or response bodies. The known validation messages are safe.
  console.error(`[marketing-worker] fatal startup error: ${safeStartupError(error)}`)
  process.exitCode = 1
})
