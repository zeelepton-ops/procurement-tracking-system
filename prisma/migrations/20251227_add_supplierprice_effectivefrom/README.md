Migration: add SupplierPrice.effectiveFrom

What's included:
- migration.sql — idempotent SQL to add "effectiveFrom", backfill values, and set NOT NULL when safe.

How to apply (recommended):
1. Review the SQL in this folder.
2. Apply in production via Supabase SQL editor or psql:
   psql "<DATABASE_URL>" -f prisma/migrations/20251227_add_supplierprice_effectivefrom/migration.sql
3. Verify:
   SELECT COUNT(*) AS nulls_remaining FROM "SupplierPrice" WHERE "effectiveFrom" IS NULL;
   SELECT MIN("effectiveFrom"), MAX("effectiveFrom") FROM "SupplierPrice";
4. Redeploy the app (Vercel) to clear any cached/prepared statements.

Backfill script (optional):
- scripts/backfills/backfill_supplierprice_effectivefrom.sql — which you can run independently to inspect results before altering NOT NULL.

Post-apply cleanup:
- Set ALLOW_RUNTIME_SCHEMA_FIXES=false and remove the runtime-autofix code in a follow-up PR.
- Consider creating a proper Prisma migration (prisma migrate) if you prefer migrations tracked by Prisma tooling.

Notes:
- The migration is intentionally idempotent and safe to re-run.
- We avoid forcing NOT NULL until we can verify there are zero NULLs.
