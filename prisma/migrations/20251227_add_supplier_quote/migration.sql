-- Idempotent migration to create SupplierQuote table
CREATE TABLE IF NOT EXISTS "SupplierQuote" (
  "id" TEXT PRIMARY KEY,
  "prepId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "quoteJson" TEXT NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierQuote_prepId_idx" ON "SupplierQuote"("prepId");
CREATE INDEX IF NOT EXISTS "SupplierQuote_supplierId_idx" ON "SupplierQuote"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierQuote' AND c.conname = 'SupplierQuote_prepId_fkey'
  ) THEN
    ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_prepId_fkey" FOREIGN KEY ("prepId") REFERENCES "POPreparation"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierQuote' AND c.conname = 'SupplierQuote_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;