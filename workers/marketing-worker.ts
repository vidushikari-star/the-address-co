import { execFile } from "node:child_process"
import { dirname, join } from "node:path"
import { promisify } from "node:util"

import { RENDER_JOB_TYPES, MarketingWorkerService } from "@/lib/marketing/services/marketing-worker-service"
import { setRenderWorkerRuntime } from "@/lib/marketing/render-runtime"
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
const workerInstanceId = process.env.RAILWAY_REPLICA_ID?.trim()
  || `${process.env.RAILWAY_DEPLOYMENT_ID?.trim() || process.env.HOSTNAME?.trim() || "worker"}-${process.pid}-${crypto.randomUUID()}`

function workerLog(level: "info" | "warn" | "error", message: string) {
  console[level](`[marketing-worker] worker_instance_id=${workerInstanceId} ${message}`)
}

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
  workerLog("info", `FFmpeg detected: ${version}`)

  const ffprobe = process.env.FFPROBE_PATH?.trim() || (path.includes("/") ? join(dirname(path), "ffprobe") : "ffprobe")
  const { stdout: probeStdout } = await execFileAsync(ffprobe, ["-version"], {
    timeout: 10_000,
    windowsHide: true,
  })
  const probeVersion = probeStdout.split("\n", 1)[0]?.trim() || "version detected"
  workerLog("info", `FFprobe detected: ${probeVersion}`)
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
  workerLog("info", `render jobs processed: ${JSON.stringify(resultSummary(result))}`)
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
  workerLog("info", `job runner response status=${response.status}${suffix}`)

  if (response.status === 401 || response.status === 403) {
    workerLog("error", "job runner authentication failed. Check MARKETING_CRON_SECRET and endpoint access.")
    return false
  }
  if (!response.ok) {
    workerLog("warn", `temporary job runner error (HTTP ${response.status}); retrying next cycle.`)
    return remoteProjectVerified
  }

  const remoteProjectRef = typeof payload?.supabaseProjectRef === "string" ? payload.supabaseProjectRef : null
  if (!remoteProjectRef) {
    workerLog("error", "Vercel runner did not return its Supabase project identity; render jobs will not be claimed.")
    return false
  }
  if (remoteProjectRef !== config.supabaseProjectRef) {
    workerLog("error", "Supabase project mismatch between Railway and Vercel; render jobs will not be claimed.")
    return false
  }
  if (!remoteProjectVerified) {
    workerLog("info", "Railway and Vercel Supabase project identities match.")
    remoteProjectVerified = true
  }
  return true
}

async function cycle(config: WorkerConfig) {
  workerLog("info", "job cycle started")
  let queueIdentityConfirmed = remoteProjectVerified
  if (!stopping) {
    try {
      queueIdentityConfirmed = await invokeRemoteRunner(config)
    } catch {
      workerLog("warn", "temporary job runner network error; retrying next cycle.")
    }
  }
  if (queueIdentityConfirmed && !stopping) {
    try {
      await runRenderJobs()
    } catch {
      workerLog("warn", "temporary render-worker error; retrying next cycle.")
    }
  } else if (!stopping) {
    workerLog("warn", "render job claim skipped until the shared Supabase project is confirmed.")
  }
  workerLog("info", "cycle completed")
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
  setRenderWorkerRuntime({ shuttingDown: true })
  workerLog("info", `${signal} received; finishing the current cycle before shutdown.`)
  wakeSleep?.()
}

async function main() {
  setRenderWorkerRuntime({ instanceId: workerInstanceId, shuttingDown: false })
  if (["1", "true"].includes(process.env.MARKETING_RENDER_SELF_TEST?.trim().toLowerCase() ?? "")) {
    const ffmpegPath = process.env.FFMPEG_PATH?.trim() || "ffmpeg"
    workerLog("info", "controlled render self-test starting; normal job cycles are disabled for this process.")
    await verifyFfmpeg(ffmpegPath)
    const diagnostic = await MarketingWorkerService.runRenderEnvironmentSelfTest(process.env.MARKETING_RENDER_SELF_TEST_CONTENT_ID?.trim() || undefined)
    const summary = diagnostic.results.map(result => ({ name: result.name, status: result.status, elapsed_ms: result.elapsedMs ?? null }))
    workerLog("info", `controlled render self-test completed: ${JSON.stringify(summary)}`)
    return
  }
  const config = readConfig()
  workerLog("info", `Marketing worker starting (interval_ms=${config.intervalMs})`)
  await verifyFfmpeg(config.ffmpegPath)
  workerLog("info", "render jobs run locally; non-render jobs are delegated to the protected Vercel runner.")

  process.once("SIGINT", () => requestShutdown("SIGINT"))
  process.once("SIGTERM", () => requestShutdown("SIGTERM"))

  while (!stopping) {
    await cycle(config)
    if (!stopping) await wait(config.intervalMs)
  }
  workerLog("info", "Marketing worker stopped")
}

main().catch(error => {
  // Do not print unknown thrown values: HTTP/client errors can include
  // sensitive URLs or response bodies. The known validation messages are safe.
  workerLog("error", `fatal startup error: ${safeStartupError(error)}`)
  process.exitCode = 1
})
