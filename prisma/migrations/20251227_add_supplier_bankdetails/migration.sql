-- Idempotent migration to create SupplierBankDetails table
CREATE TABLE IF NOT EXISTS "SupplierBankDetails" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL UNIQUE,
  "bankName" TEXT,
  "accountName" TEXT,
  "iban" TEXT,
  "swift" TEXT,
  "currency" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierBankDetails_supplierId_idx" ON "SupplierBankDetails"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierBankDetails' AND c.conname = 'SupplierBankDetails_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierBankDetails" ADD CONSTRAINT "SupplierBankDetails_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;