import type { MarketingFormat } from "@/lib/marketing/types"

/**
 * Bump this whenever the server-side generation trace changes. It is a static
 * build fingerprint, not a user- or property-specific identifier.
 */
export const MARKETING_GENERATION_DIAGNOSTIC_VERSION = "generation-origin-trace-v1"

export const MARKETING_CONTENT_GENERATE_ROUTE = "/api/marketing/content/[id]/generate"

function safeBuildValue(value: string | undefined) {
  return value?.trim() || null
}

export function marketingGenerationRuntimeDiagnostic() {
  return {
    route: MARKETING_CONTENT_GENERATE_ROUTE,
    diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
    gitSha: safeBuildValue(process.env.VERCEL_GIT_COMMIT_SHA),
    deploymentId: safeBuildValue(process.env.VERCEL_DEPLOYMENT_ID),
  }
}

type MarketingGenerationBreadcrumb = {
  event:
    | "route_entered"
    | "content_row_loaded"
    | "format_resolved"
    | "creative_ai_service_entered"
    | "openai_request_started"
    | "openai_response_received"
    | "provider_output_access"
    | "structural_parse"
    | "factual_validation"
    | "overflow_detection"
    | "repair_request"
    | "repair_parse"
    | "normalization"
    | "final_renderer_validation"
    | "creative_output_validation"
    | "composition_creation"
    | "persistence_start"
    | "persistence_complete"
    | "route_success"
  format: MarketingFormat | null
  stage?: string | null
  contentId?: string
}

/** Metadata-only request trace; never pass copy, facts, prompts, or URLs. */
export function logMarketingGenerationBreadcrumb(input: MarketingGenerationBreadcrumb) {
  console.info("Marketing generation breadcrumb:", JSON.stringify({
    diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
    route: MARKETING_CONTENT_GENERATE_ROUTE,
    event: input.event,
    format: input.format,
    stage: input.stage ?? null,
    contentId: input.contentId ?? null,
  }))
}
