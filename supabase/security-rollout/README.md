# Pending Supabase security rollout

These are **review artifacts**, deliberately kept outside `supabase/migrations`.
They must not be run by `supabase db push`, copied into the normal migration
chain, or applied to production until the stage-specific preflight checks in
[`docs/supabase-rls-security-audit.md`](../../docs/supabase-rls-security-audit.md)
have passed in a disposable Supabase project.

After a stage is approved, copy only that reviewed SQL into a new, monotonic
production migration with a new timestamp. Do not use `--include-all`.

The SQL files contain a forward transaction and a documented rollback plan.
They make no data changes, but RLS and bucket changes can make an otherwise
healthy application unavailable when callers have not been migrated first.

The read-only [`catalog-audit.sql`](catalog-audit.sql) can be run in the
Supabase SQL editor or against a non-production database to refresh the
inventory without querying application-table rows.
