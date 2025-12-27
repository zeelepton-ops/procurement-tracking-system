-- Idempotent migration to create EnquiryResponse table
CREATE TABLE IF NOT EXISTS "EnquiryResponse" (
  "id" TEXT PRIMARY KEY,
  "enquiryId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "quoteJson" TEXT NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "attachments" TEXT,
  "respondedAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "EnquiryResponse_enquiryId_idx" ON "EnquiryResponse"("enquiryId");
CREATE INDEX IF NOT EXISTS "EnquiryResponse_supplierId_idx" ON "EnquiryResponse"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'EnquiryResponse' AND c.conname = 'EnquiryResponse_enquiryId_fkey'
  ) THEN
    ALTER TABLE "EnquiryResponse" ADD CONSTRAINT "EnquiryResponse_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'EnquiryResponse' AND c.conname = 'EnquiryResponse_supplierId_fkey'
  ) THEN
    ALTER TABLE "EnquiryResponse" ADD CONSTRAINT "EnquiryResponse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;