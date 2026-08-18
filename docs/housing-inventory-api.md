# Housing.com Inventory Submission API

## Purpose and scope

`POST https://the-address-co-seven.vercel.app/api/integrations/housing/inventory`

This is The Address Co's **inventory intake** endpoint. It accepts a Housing listing, validates it, and stores the latest version in the secure Housing inbox for review. It does **not** create or update a live CRM property, create contacts/leads, download images, or publish inventory.

Housing already has a separate lead flow: this CRM pulls broker leads from Housing. `POST /api/integrations/housing/leads` intentionally does not accept lead pushes. The `name`, `email`, and `phone` fields below are therefore the public/business **listing contact** for an inventory record, not a customer enquiry/lead.

## Authentication

Send the dedicated key only in the request header:

```http
Authorization: Bearer <HOUSING_INVENTORY_API_KEY>
Content-Type: application/json
Accept: application/json
```

The real credential is shared separately through an approved secret-sharing channel. Do not put it in source control, a URL, logs, screenshots, or email. The currently working production key remains valid; do not generate or rotate it for this contract update. The CRM's server-only `SUPABASE_SERVICE_ROLE_KEY` is never shared with Housing.

## Listing contact contract

Housing requested parameters named `name`, `email`, and `phone`. They are top-level fields in this API contract:

```json
{
  "external_id": "TEST-SIOLIM-001",
  "name": "Advisor Name",
  "email": "advisor@example.com",
  "phone": "+919876543210"
}
```

They represent the public/business contact to whom enquiries about this listing should be routed. They must not contain a property owner's private details unless that owner is the explicitly authorised public listing contact.

The CRM normalizes those three fields into an internal `listing_contact` object in the stored inbox payload. This internal object is not a different external request format; Housing must continue to send the three top-level fields.

### Contact validation

| Field | Rule |
| --- | --- |
| `name` | Required. String, trimmed, 1–160 characters, and must be a public/business name rather than a UUID or raw internal identifier. |
| `phone` | Required. String. Indian ten-digit numbers are normalized to `+91…`; `+` international numbers and `00` international prefixes are accepted when E.164-length compatible. |
| `email` | Optional and nullable. If supplied, it must be a valid email address. Blank whitespace is treated as absent. |

Examples of accepted phone input include `+919876543210`, `9876543210`, `+44 20 7946 0958`, and `0044 20 7946 0958`. The stored normalized value uses `+` and digits only.

Submissions without `name` or `phone` return `422`. This is intentional: accepting a listing that cannot route an enquiry would make the production inventory contract unusable. Existing inbox rows remain viewable, but legacy submissions without these fields are not accepted for new or update requests.

## Production-ready cURL

```bash
curl -X POST \
  'https://the-address-co-seven.vercel.app/api/integrations/housing/inventory' \
  -H 'Authorization: Bearer <HOUSING_INVENTORY_API_KEY>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "external_id": "TEST-SIOLIM-001",
    "name": "Advisor Name",
    "email": "advisor@example.com",
    "phone": "+919876543210",
    "property_category": "residential",
    "listing_intent": "sell",
    "building_or_society_name": "Sample Villa",
    "property_type": "villa",
    "built_up_area": {
      "value": 2800,
      "unit": "sqft"
    },
    "carpet_area": {
      "value": 2200,
      "unit": "sqft"
    },
    "plot_area": {
      "value": 808,
      "unit": "sqm"
    },
    "transaction_type": "resale",
    "construction_status": "ready_to_move",
    "property_age_years": 4,
    "bedrooms": 4,
    "bathrooms": 4,
    "balconies": 2,
    "furnishing_status": "fully_furnished",
    "furnishings": [
      "air_conditioning",
      "wardrobes",
      "modular_kitchen"
    ],
    "covered_parking": 2,
    "open_parking": 1,
    "price": {
      "amount": 52000000,
      "currency": "INR"
    },
    "maintenance_monthly": 10000,
    "brokerage": {
      "applicable": true,
      "amount": 100000,
      "negotiable": true
    },
    "floor_number": null,
    "total_floors": 2,
    "facing": "north_east",
    "servant_room": true,
    "description": "Sample property description.",
    "address": {
      "locality": "Siolim",
      "city": "Goa",
      "state": "Goa",
      "pincode": "403517"
    },
    "images": [
      {
        "url": "https://example.com/property-1.jpg",
        "position": 1,
        "is_cover": true
      }
    ],
    "property_highlights": [
      "Private pool",
      "Garden",
      "Fully furnished"
    ]
  }'
```

## Field specification

Required fields are `external_id`, `name`, `phone`, `property_category`, `listing_intent`, `property_type`, and `construction_status`, plus the conditional fields described below.

| Field | Type / accepted values | Requirement |
| --- | --- | --- |
| `external_id` | string, max 180 characters | Required; stable Housing listing reference. |
| `name` | trimmed string | Required listing contact. |
| `email` | email string or `null` | Optional listing contact email. |
| `phone` | Indian or international phone string | Required listing contact phone. |
| `property_category` | `residential`, `commercial` | Required. |
| `listing_intent` | `sell`, `rent`, `pg_coliving` | Required. |
| `building_or_society_name` | string or `null` | Optional. |
| `property_type` | See enum table below | Required. |
| `built_up_area`, `carpet_area`, `plot_area` | `{ "value": positive number, "unit": "sqft"\|"sqm"\|"sqyd"\|"acre"\|"hectare" }` or `null` | Conditional / optional. |
| `transaction_type` | `new_booking`, `resale`, or `null` | Required for `sell`. |
| `construction_status` | `ready_to_move`, `under_construction` | Required. |
| `property_age_years` | integer 0–250 or `null` | Optional. |
| `bedrooms`, `bathrooms`, `balconies` | integer 0–50 or `null` | Optional. |
| `furnishing_status` | `fully_furnished`, `semi_furnished`, `unfurnished`, or `null` | Optional. |
| `furnishings`, `property_highlights` | arrays of short strings | Optional. |
| `covered_parking`, `open_parking` | integer 0–100 or `null` | Optional. |
| `price`, `monthly_rent` | `{ "amount": positive number, "currency": "INR" }` or `null` | Conditional / optional. |
| `maintenance_monthly` | non-negative number or `null` | Optional. |
| `brokerage` | `{ "applicable": boolean, "amount"?: number, "negotiable"?: boolean }` or `null` | Optional. |
| `floor_number` | integer -10–300 or `null` | Optional. |
| `total_floors` | integer 1–300 or `null` | Optional. |
| `facing` | See enum table below, or `null` | Optional. |
| `servant_room` | boolean or `null` | Optional. |
| `description` | trimmed string, max 20,000 characters, or `null` | Optional. |
| `address` | address object | Optional; supplied `pincode` must contain six digits. |
| `images` | HTTPS image URLs; maximum 50 | Optional. Phase 1 stores references only. |

### Enum values

| Field | Values |
| --- | --- |
| `property_type` | `apartment`, `independent_house`, `duplex`, `independent_floor`, `villa`, `penthouse`, `studio`, `plot`, `farm_house`, `agricultural_land` |
| `transaction_type` | `new_booking`, `resale` |
| `construction_status` | `ready_to_move`, `under_construction` |
| `furnishing_status` | `fully_furnished`, `semi_furnished`, `unfurnished` |
| `facing` | `north`, `east`, `west`, `south`, `north_east`, `north_west`, `south_east`, `south_west` |

### Conditional validation

- Building listings, including villas, require `built_up_area.value`.
- `plot` and `agricultural_land` listings require `plot_area.value`.
- `sell` listings require `price.amount` and `transaction_type`.
- `rent` listings require `monthly_rent.amount` or `price.amount`.
- All image URLs must use HTTPS.
- Requests must be JSON objects no larger than 1 MB.

Unknown additional fields are retained as opaque inbox metadata for review, but are not mapped into CRM records.

## Idempotency and responses

`external_id` is the idempotency key and must remain stable for the same listing. A repeat submission with the same ID atomically replaces the latest stored payload and increments its inbox `version`; it never creates a duplicate Housing inbox record.

First accepted submission (`201`):

```json
{
  "success": true,
  "external_id": "TEST-SIOLIM-001",
  "status": "accepted",
  "message": "Inventory accepted for processing."
}
```

Updated submission (`200`) returns `"status": "updated"` and `"message": "Inventory update accepted."`.

| Status | Meaning |
| --- | --- |
| `401` | Missing or invalid API key. |
| `422` | Validation failure; response includes safe field-level errors. |
| `429` | Per-instance rate limit reached; retry after the supplied `Retry-After` seconds. |
| `500` | Unexpected server failure; retry with the returned `X-Request-ID`. |

Example validation failure:

```json
{
  "success": false,
  "external_id": "TEST-SIOLIM-001",
  "error": "Validation failed",
  "fields": [
    {
      "field": "phone",
      "message": "phone is required."
    }
  ]
}
```

## Health check

```bash
curl -X GET \
  'https://the-address-co-seven.vercel.app/api/integrations/housing/health' \
  -H 'Authorization: Bearer <HOUSING_INVENTORY_API_KEY>' \
  -H 'Accept: application/json'
```

An authenticated request returns:

```json
{
  "status": "ok",
  "provider": "housing",
  "timestamp": "2026-08-18T12:00:00.000Z",
  "request_id": "uuid"
}
```

## Inbox and safe logging

Administrators can review the inbox at **Settings → Integrations → Housing.com**. It shows external ID, property/project, listing-contact name, masked phone, email, locality, validation status, version, and receipt time. Full normalized payload inspection is available only on that administrator-only page.

Operational logs use request ID, external ID, stage, status, and sanitized database details. They never include the Authorization header, API key, full phone/email, full description, signed image URLs, or service-role key.

## Phase 2 mapping readiness — not enabled

No Phase 2 mapping is live. The following is a planning map only; it does not create a property, contact, relationship, or advisor assignment.

| Housing API field | Normalized inbox field | Future CRM destination | Transformation | Requirement |
| --- | --- | --- | --- | --- |
| `external_id` | `housing_inventory_submissions.external_id` | `properties.housing_listing_id` | Stable external identifier | Required |
| `name` | `payload.listing_contact.name` | Dedicated future listing-contact relationship | Public/business display name; never infer owner | Required |
| `email` | `payload.listing_contact.email` | Dedicated future listing-contact relationship | Validated lowercase email | Optional |
| `phone` | `payload.listing_contact.phone` | Dedicated future listing-contact relationship | E.164-style normalized phone | Required |
| category, intent, type | `payload.property_*`, `listing_intent` | `properties.property_type`, transaction/listing fields | Explicit enum map | Required |
| society, description, highlights | payload fields | property name, description, amenities/tags | Curated Phase 2 map | Optional |
| areas, beds, baths, furnishing, floors | payload fields | property specifications | Unit/enum conversion | Conditional / optional |
| price, rent, maintenance, brokerage | payload fields | property pricing / commission review | Never infer missing values | Conditional / optional |
| address | `payload.address` | property location/locality | Human review and geocoding policy | Optional |
| images | `payload.images` | `property_images` | Async trusted-media ingestion | Optional |

For a future internally generated Housing feed, source the listing contact in this order:

1. An explicitly selected, authorised Housing/listing contact.
2. A verified structured assigned advisor for the property.
3. The configured business fallback: `company_name`, `company_email`, and `company_phone`.

The current property `advisor` field is free text rather than a verifiable contact relationship, so it must not be auto-used for this purpose. Property-owner relationships, unrelated CRM contacts, deal participants, and raw internal user IDs must never be substituted. Adding a dedicated property-level listing-contact model and its consent/assignment UI requires explicit Phase 2 approval.
