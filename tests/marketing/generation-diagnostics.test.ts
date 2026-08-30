import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

import { describe, expect, it } from "vitest"

import {
  MARKETING_CONTENT_GENERATE_ROUTE,
  MARKETING_GENERATION_DIAGNOSTIC_VERSION,
  marketingGenerationRuntimeDiagnostic,
} from "@/lib/marketing/generation-diagnostics"

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

describe("Marketing generation diagnostics", () => {
  it("has one unambiguous server emitter for the exact generation-failure log", () => {
    const root = process.cwd()
    const emitters = ["app", "lib", "workers"]
      .flatMap(directory => sourceFiles(join(root, directory)))
      .filter(path => readFileSync(path, "utf8").includes("Marketing AI generation failed:"))
      .map(path => relative(root, path))

    expect(emitters).toEqual(["app/api/marketing/content/[id]/generate/route.ts"])
    const routeSource = readFileSync(join(root, emitters[0]!), "utf8")
    expect(routeSource).toContain('origin: "content_generate_route"')
    expect(routeSource).toContain("diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION")
  })

  it("exposes only safe build metadata with the static diagnostic revision", () => {
    const diagnostic = marketingGenerationRuntimeDiagnostic()

    expect(diagnostic).toEqual({
      route: MARKETING_CONTENT_GENERATE_ROUTE,
      diagnosticVersion: MARKETING_GENERATION_DIAGNOSTIC_VERSION,
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID?.trim() || null,
    })
  })
})
