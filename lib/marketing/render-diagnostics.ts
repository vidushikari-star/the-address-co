type RenderStage = "input" | "workspace" | "download" | "logo" | "ffmpeg" | "output" | "upload" | "asset_persistence" | "version_persistence" | "content_transition"

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
  constructor(readonly stage: RenderStage, reason: unknown) {
    super(`Render ${stage} failed: ${sanitizeRenderDiagnostic(reason)}`)
    this.name = "RenderStageError"
  }
}

export function logRenderStage(stage: RenderStage, status: "started" | "ok" | "failed", details?: Record<string, string | number | boolean>) {
  const suffix = details
    ? ` ${Object.entries(details).map(([key, value]) => `${key}=${String(value)}`).join(" ")}`
    : ""
  const message = `[marketing-render] stage=${stage} status=${status}${suffix}`
  if (status === "failed") console.error(message)
  else console.info(message)
}

export function renderStageFailure(stage: RenderStage, error: unknown) {
  const reason = sanitizeRenderDiagnostic(error)
  logRenderStage(stage, "failed", { reason })
  return new RenderStageError(stage, reason)
}
