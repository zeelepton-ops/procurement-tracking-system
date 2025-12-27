-- Idempotent migration to create SupplierPrice table
CREATE TABLE IF NOT EXISTS "SupplierPrice" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "itemKey" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'QAR',
  "effectiveFrom" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierPrice_supplierId_idx" ON "SupplierPrice"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierPrice' AND c.conname = 'SupplierPrice_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;