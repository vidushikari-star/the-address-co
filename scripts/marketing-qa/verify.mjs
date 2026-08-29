import { assertMarketingQaTarget, loadMarketingQaEnvironment } from "./safety.mjs"

loadMarketingQaEnvironment()
await assertMarketingQaTarget()
console.log("Marketing QA safety check passed for the verified non-production environment.")
