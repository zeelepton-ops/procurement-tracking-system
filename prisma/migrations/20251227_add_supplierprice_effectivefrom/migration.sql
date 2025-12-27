-- 20251227_add_supplierprice_effectivefrom
-- Idempotent migration: add "effectiveFrom" to SupplierPrice, backfill, and set NOT NULL only if safe.

BEGIN;

-- 1) Add column if missing
ALTER TABLE "SupplierPrice"
  ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP WITHOUT TIME ZONE;

-- 2) Backfill from best available fields
UPDATE "SupplierPrice"
SET "effectiveFrom" = COALESCE("validFrom", "createdAt", now())
WHERE "effectiveFrom" IS NULL;

-- 3) Make column NOT NULL only if there are no NULLs left
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "SupplierPrice" WHERE "effectiveFrom" IS NULL) = 0 THEN
    EXECUTE 'ALTER TABLE "SupplierPrice" ALTER COLUMN "effectiveFrom" SET NOT NULL';
  END IF;
END
$$;

COMMIT;

-- Verification (run after migration):
-- SELECT COUNT(*) AS nulls_remaining FROM "SupplierPrice" WHERE "effectiveFrom" IS NULL;
-- SELECT count(*) AS total FROM "SupplierPrice";
-- SELECT MIN("effectiveFrom"), MAX("effectiveFrom") FROM "SupplierPrice";
-- Note: This file is safe to re-run (idempotent) and intentionally performs non-destructive checks before applying NOT NULL.
