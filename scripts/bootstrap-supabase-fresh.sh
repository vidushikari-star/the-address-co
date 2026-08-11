#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || -z "${1}" ]]; then
  echo "Usage: $0 <fresh-postgres-connection-url>" >&2
  exit 64
fi

schema_baseline_db_url="$1"
script_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$script_root"

# This check refuses a linked production database and any target that has
# already started a migration history. It is intentionally not a marker or an
# environment switch: the baseline files are outside the production chain.
npx supabase db query --db-url "$schema_baseline_db_url" --file supabase/baseline/assert-fresh-target.sql
npx supabase db query --db-url "$schema_baseline_db_url" --file supabase/baseline/pre-migrations-legacy-crm.sql
npx supabase db push --db-url "$schema_baseline_db_url"
npx supabase db query --db-url "$schema_baseline_db_url" --file supabase/baseline/post-migrations-legacy-crm.sql
