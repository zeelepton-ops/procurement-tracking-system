-- Idempotent migration to create SupplierDocument table
CREATE TABLE IF NOT EXISTS "SupplierDocument" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "uploadedBy" TEXT,
  "uploadedAt" TIMESTAMP(3) DEFAULT now(),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT
);

CREATE INDEX IF NOT EXISTS "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierDocument' AND c.conname = 'SupplierDocument_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;