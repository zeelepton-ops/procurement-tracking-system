-- Idempotent migration to create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "enquiryId" TEXT,
  "supplierId" TEXT,
  "channel" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerResult" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT now(),
  "updatedAt" TIMESTAMP(3) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Notification_enquiryId_idx" ON "Notification"("enquiryId");
CREATE INDEX IF NOT EXISTS "Notification_supplierId_idx" ON "Notification"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'Notification' AND c.conname = 'Notification_enquiryId_fkey'
  ) THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'Notification' AND c.conname = 'Notification_supplierId_fkey'
  ) THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE;
  END IF;
END$$;