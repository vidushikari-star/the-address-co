type RenderStage = "input" | "workspace" | "download" | "logo" | "scene" | "concat" | "ffmpeg" | "output" | "upload" | "asset_persistence" | "version_persistence" | "content_transition" | "diagnostic"

export type RenderProcessDiagnostics = Record<string, string | number | boolean | null>

type RenderWorkerRuntime = {
  instanceId: string
  shuttingDown: boolean
}

// A web process can invoke the renderer during a controlled diagnostic, while
// Railway configures this at worker boot.  The fallback is intentionally local
// and contains no deployment URL or credential.
const renderWorkerRuntime: RenderWorkerRuntime = {
  instanceId: `process-${process.pid}`,
  shuttingDown: false,
}

export function setRenderWorkerRuntime(runtime: Partial<RenderWorkerRuntime>) {
  Object.assign(renderWorkerRuntime, runtime)
}

export function getRenderWorkerRuntime() {
  return renderWorkerRuntime
}

/** Removes URLs, credentials and drawtext payloads before logs or job records. */
export function sanitizeRenderDiagnostic(value: unknown, limit = 700) {
  const message = value instanceof Error ? value.message : String(value ?? "Unknown render failure.")
  return message
    .replace(/https?:\/\/[^\s'"\])]+/gi, "[url]")
    .replace(/\b(authorization|api[_-]?key|token|signature|sig)(?:=|:)\s*[^\s,;]*/gi, "$1=[redacted]")
    .replace(/drawtext=text='(?:\\.|[^'])*'/gi, "drawtext=text='[redacted]'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit)
}

export class RenderStageError extends Error {
  constructor(readonly stage: RenderStage, reason: unknown, readonly diagnostics?: RenderProcessDiagnostics) {
    super(`Render ${stage} failed: ${sanitizeRenderDiagnostic(reason)}`)
    this.name = "RenderStageError"
  }
}

export function logRenderStage(stage: RenderStage, status: "started" | "ok" | "failed", details?: Record<string, string | number | boolean>) {
  const runtime = getRenderWorkerRuntime()
  const withRuntime = {
    worker_instance_id: runtime.instanceId,
    worker_shutting_down: runtime.shuttingDown,
    ...details,
  }
  const suffix = ` ${Object.entries(withRuntime).map(([key, value]) => `${key}=${String(value)}`).join(" ")}`
  const message = `[marketing-render] stage=${stage} status=${status}${suffix}`
  if (status === "failed") console.error(message)
  else console.info(message)
}

export function renderStageFailure(stage: RenderStage, error: unknown, diagnostics?: RenderProcessDiagnostics) {
  const reason = sanitizeRenderDiagnostic(error)
  logRenderStage(stage, "failed", { reason })
  return new RenderStageError(stage, reason, diagnostics)
}
