-- Idempotent migration to create SupplierReference table
CREATE TABLE IF NOT EXISTS "SupplierReference" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "projectName" TEXT,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierReference_supplierId_idx" ON "SupplierReference"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierReference' AND c.conname = 'SupplierReference_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierReference" ADD CONSTRAINT "SupplierReference_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;