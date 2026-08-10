export function isMarketingEnabled() {
  return process.env.MARKETING_ENABLED === "true"
}

export function isInstagramPublishingEnabled() {
  return process.env.INSTAGRAM_PUBLISHING_ENABLED === "true"
}
