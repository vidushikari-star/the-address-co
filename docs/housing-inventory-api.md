# Housing.com Inventory Submission API

## Endpoint

`POST https://the-address-co-seven.vercel.app/api/integrations/housing/inventory`

This is a phase-1 intake endpoint. It accepts and validates inventory, then stores the latest submission in The Address Co CRM integration inbox. It does **not** create or update a live CRM property, download images, or publish inventory.

## Authentication

Housing will receive a dedicated API key separately. Send it only in the request header:

```http
Authorization: Bearer <HOUSING_INVENTORY_API_KEY>
Content-Type: application/json
Accept: application/json
```

Never put the key in a query string, source code, logs, or email. A missing or invalid key returns:

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## cURL

```bash
curl -X POST \
  'https://the-address-co-seven.vercel.app/api/integrations/housing/inventory' \
  -H 'Authorization: Bearer <HOUSING_INVENTORY_API_KEY>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "external_id": "TEST-001",
    "property_category": "residential",
    "listing_intent": "sell",
    "building_or_society_name": "Sample Villa",
    "property_type": "villa",
    "built_up_area": {
      "value": 2800,
      "unit": "sqft"
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
    "brokerage": {
      "applicable": true,
      "amount": 100000,
      "negotiable": true
    },
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

## Supported values

| Field | Values |
| --- | --- |
| `property_category` | `residential`, `commercial` |
| `listing_intent` | `sell`, `rent`, `pg_coliving` |
| `property_type` | `apartment`, `independent_house`, `duplex`, `independent_floor`, `villa`, `penthouse`, `studio`, `plot`, `farm_house`, `agricultural_land` |
| `transaction_type` | `new_booking`, `resale` |
| `construction_status` | `ready_to_move`, `under_construction` |
| `furnishing_status` | `fully_furnished`, `semi_furnished`, `unfurnished` |
| `facing` | `north`, `east`, `west`, `south`, `north_east`, `north_west`, `south_east`, `south_west` |

## Validation

`external_id` is required and is Housing's stable listing reference.

- Sell listings require `price.amount` and `transaction_type`.
- Rent listings require `monthly_rent.amount` or `price.amount`; `transaction_type` can be omitted.
- Building listings (including villas) require `built_up_area.value`.
- `plot` and `agricultural_land` listings require `plot_area.value`; bedrooms, bathrooms, and furnishing are optional.
- `property_age_years` is optional, including for under-construction listings.
- Images are stored as references only in phase 1. They must use HTTPS and a request may contain at most 50 images.
- Requests must contain a JSON object and be no larger than 1 MB.

Validation failures return `422` and list actionable fields. Example:

```json
{
  "success": false,
  "external_id": "TEST-001",
  "error": "Validation failed",
  "fields": [
    {
      "field": "built_up_area.value",
      "message": "Built-up area is required for this property type."
    }
  ]
}
```

## Idempotency and success responses

The inbox has a unique `external_id`. A first valid submission returns `201`:

```json
{
  "success": true,
  "external_id": "TEST-001",
  "status": "accepted",
  "message": "Inventory accepted for processing."
}
```

Resubmitting the same `external_id` atomically replaces the stored latest payload, increments its inbox version, and returns `200`:

```json
{
  "success": true,
  "external_id": "TEST-001",
  "status": "updated",
  "message": "Inventory update accepted."
}
```

## Connection test

```bash
curl -X GET \
  'https://the-address-co-seven.vercel.app/api/integrations/housing/health' \
  -H 'Authorization: Bearer <HOUSING_INVENTORY_API_KEY>' \
  -H 'Accept: application/json'
```

It returns `{ "status": "ok", "provider": "housing", "timestamp": "…" }` when authenticated.

## Operational notes

Incoming submissions are stored in `housing_inventory_submissions` and can be reviewed at **Settings → Integrations → Housing.com**. The endpoint has constant-time API-key comparison, request IDs returned in the `X-Request-ID` header, per-instance rate limiting, and safe audit logs. The API key and full payload descriptions are never written to logs.

Generate the production key locally, then store it only in **Vercel Production** as `HOUSING_INVENTORY_API_KEY`:

```bash
openssl rand -hex 32
```

Share the generated value with Housing through an approved secret-sharing channel. The existing server-only `SUPABASE_SERVICE_ROLE_KEY` is also required by the CRM to persist submissions; never give it to Housing.

## Future phase 2

The stable public request contract remains unchanged. A later internal pipeline can take a validated inbox record through normalization, CRM property create/update, and asynchronous media ingestion. That mapping is intentionally not enabled in phase 1.
