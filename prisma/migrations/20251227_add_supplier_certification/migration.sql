-- Idempotent migration to create SupplierCertification table
CREATE TABLE IF NOT EXISTS "SupplierCertification" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "certNumber" TEXT,
  "issuedBy" TEXT,
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "documentId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "SupplierCertification_supplierId_idx" ON "SupplierCertification"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierCertification' AND c.conname = 'SupplierCertification_supplierId_fkey'
  ) THEN
    ALTER TABLE "SupplierCertification" ADD CONSTRAINT "SupplierCertification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'SupplierCertification' AND c.conname = 'SupplierCertification_documentId_fkey'
  ) THEN
    ALTER TABLE "SupplierCertification" ADD CONSTRAINT "SupplierCertification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SupplierDocument"(id) ON DELETE SET NULL;
  END IF;
END$$;