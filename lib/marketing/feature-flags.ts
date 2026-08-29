export function isMarketingEnabled() {
  return process.env.MARKETING_ENABLED === "true"
}

export function isInstagramPublishingEnabled() {
  return process.env.INSTAGRAM_PUBLISHING_ENABLED === "true"
}

/**
 * Scheduling remains available in existing environments unless explicitly
 * disabled. The dedicated Marketing QA launcher sets this false so it cannot
 * create publication queue work, even against a disposable backend.
 */
export function isMarketingSchedulingEnabled() {
  return process.env.MARKETING_SCHEDULING_ENABLED !== "false"
}
