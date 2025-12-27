-- Backfill script: backfill_supplierprice_effectivefrom.sql
-- Use psql or Supabase SQL editor to run this file against the production DB.
-- This script is idempotent: safe to re-run.

-- 0) Show current counts before change
SELECT 'before' AS stage, COUNT(*) FILTER (WHERE "effectiveFrom" IS NULL) AS nulls, COUNT(*) AS total
FROM "SupplierPrice";

-- 1) Ensure column exists (if not, create it)
ALTER TABLE "SupplierPrice" ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP WITHOUT TIME ZONE;

-- 2) Backfill with best available data (validFrom -> createdAt -> now())
UPDATE "SupplierPrice"
SET "effectiveFrom" = COALESCE("validFrom", "createdAt", now())
WHERE "effectiveFrom" IS NULL;

-- 3) Show counts after backfill
SELECT 'after' AS stage, COUNT(*) FILTER (WHERE "effectiveFrom" IS NULL) AS nulls, COUNT(*) AS total
FROM "SupplierPrice";

-- 4) (Optional) If no NULLs remain, make column NOT NULL. Run separately once you confirm.
-- ALTER TABLE "SupplierPrice" ALTER COLUMN "effectiveFrom" SET NOT NULL;

-- Notes:
--  - Run this via: psql "<your-prod-connection-string>" -f scripts/backfills/backfill_supplierprice_effectivefrom.sql
--  - Verify output: 'after' nulls should be 0 before applying SET NOT NULL
