-- Idempotent migration to create SupplierCapability table
-- Create SupplierCapability table if missing
CREATE TABLE IF NOT EXISTS "SupplierCapability" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "details" TEXT,
  "capacity" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierCapability_supplierId_idx" ON "SupplierCapability"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierCapability' AND c.conname = 'SupplierCapability_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierCapability" ADD CONSTRAINT "SupplierCapability_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;