# Public property share security

## Status

The public `/share/[slug]` route now treats its path segment as a **public share
token**, not a CRM property slug. It is resolved by a server-only, service-role
projection in `lib/public/property-share.ts`. The browser never imports a CRM
repository or Supabase client for this page.

This change does not apply the staged RLS or storage migrations. It prepares the
application for them; production policy and bucket changes remain separately
reviewable under `supabase/security-rollout/`.

## Previous anonymous dependency and field exposure

| Source | Previous browser read | Publicly reachable fields before this change |
| --- | --- | --- |
| `properties` | `select(*)` by predictable `slug` | Every property column, including `note`, `advisor`, price JSON (including commission), mapping data, integration fields, and internal ID |
| `property_images` | `select(*)` by property ID | Every image row and its internal UUID/property relation |
| `property_documents` | `select(*)` by property ID | Every document row, file URL, category, internal UUID/property relation, including legal and transaction files |
| `user_profiles` | selected by `?advisor=<UUID>` | Advisor UUID, name, phone, and WhatsApp number |
| `contacts` and `activities` | client-side enquiry write | Browser wrote CRM contacts and activity rows directly |

## Current public projection

The server returns only the fields below. It does not return a property ID,
CRM slug, notes, contacts, owner data, deals, commissions, expenses, audit data,
or integration metadata.

| Category | Returned only when allowed |
| --- | --- |
| Property | title, locality (or exact location only when selected), listing/transaction/property type, development/furnishing status, bedroom/bathroom/area, public description, amenities |
| Price | sale asking price or monthly rent only when `public_share_show_price` is true; security deposits and commission are never projected |
| Media | `property_images` rows for the exact property with `public_share_allowed = true`; no media UUIDs or property IDs |
| Documents | brochure/floor-plan rows only, when both the share and document row opt in; delivered as five-minute signed URLs |
| Advisor | only the specifically entered public name, phone, WhatsApp, and email when `public_share_show_advisor_contact` is true; no profile lookup or query-string identifier |

The token is a UUID generated only when an administrator first saves public-share
settings. All shares start disabled; existing slug links intentionally no longer
resolve as public property pages, preventing predictable enumeration.

## Controls and revocation

The Property detail page has a Public share card for CRM administrators. It can
enable or disable the share, set optional expiry, select visibility fields, enter
deliberate advisor contact information, and choose the exact gallery and
brochure/floor-plan rows that may appear.

Saving calls a protected server route. It generates a token if needed,
validates that selected media belongs to that property, updates the explicit
allowlists, and revalidates the share route. The public page calls Next's
`connection()` before resolving its data, so it is request-time rendered. A
disabled or expired token returns `notFound`; it cannot get new signed document
URLs. An already-issued document URL can remain valid for at most five minutes.

## Document and storage rollout

This deployment changes the public-share path to short-lived signed document
links, but **does not itself change the current production bucket**. The current
`property-documents` bucket is still public until the separately reviewed Stage
3 storage rollout is applied. Consequently, known legacy public object URLs may
remain reachable in production today. Do not claim the bucket is private until
that rollout is deployed and tested.

Before Stage 3, change authenticated CRM document upload/list/download flows
away from `getPublicUrl()` so they use authorized signed URLs too. Then Stage 3
can make `property-documents` private without breaking CRM users. The public
share implementation is already compatible with a private bucket because its
server service role creates signed URLs only after validating the public token
and document allowlist.

`property-images` remains public-read by the existing product decision. This
page only references rows explicitly selected for a share; do not place
confidential/off-market media in that bucket.

## RLS readiness and verification

After this deploy, the public share no longer needs anonymous `SELECT` access to
`properties`, `property_images`, `property_documents`, or `user_profiles`, and
the enquiry browser no longer needs direct CRM writes to `contacts` or
`activities`. The Stage 1 anonymous CRM policies can therefore be removed once
the signed-in CRM workflows are smoke-tested. The documents bucket must wait for
the distinct Stage 3 review described above.

Run the unit suite for projection, revocation, visibility, signed-document and
browser-boundary coverage. Before any RLS rollout, run the smoke checklist in
`docs/supabase-rls-security-audit.md` against a disposable Supabase project:
anon requests must be denied for all core CRM tables, the tokenized public page
must still render, a private document object must fail anonymously, and a
selected brochure must be renewed only through the public projection.
