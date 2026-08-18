import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const migrationPath = join(process.cwd(), "supabase", "migrations", "20260818120000_harden_image_only_carousels_and_publication_recovery.sql")

describe("Carousel publication recovery migration", () => {
  it("enforces image-only Carousel media at the database boundary", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("create or replace function public.assert_valid_marketing_carousel")
    expect(migration).toContain("asset.media_type <> 'image'")
    expect(migration).toContain("This Carousel contains unsupported video media. Remove the video before continuing.")
    expect(migration).toContain("create trigger enforce_marketing_carousel_invariant")
    expect(migration).toContain("perform public.assert_valid_marketing_carousel(target.id, target.composition)")
  })

  it("keeps ambiguous media_publish attempts out of automatic recovery", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain("create or replace function public.recover_marketing_publication")
    expect(migration).toContain("publication.external_publication_id is not null or publication.publish_attempted_at is not null")
    expect(migration).toContain("Publication outcome requires verification before retrying.")
    expect(migration).toContain("create or replace function public.fail_marketing_publication")
    expect(migration).toContain("create or replace function public.recover_stale_marketing_jobs()")
    expect(migration).toContain("returns table (requeued_count integer, failed_publish_count integer)")
    expect(migration).toContain("returning content.id as content_id, publication.publish_attempted_at")
    expect(migration).toContain("where publication.content_id = content.id and publication.publish_attempted_at is not null")
  })
})
