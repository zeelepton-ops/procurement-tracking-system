-- Create DeliveryNoteRequest table for DN issue workflow
CREATE TABLE IF NOT EXISTS "DeliveryNoteRequest" (
  "id" TEXT NOT NULL,
  "jobOrderId" TEXT,
  "jobOrderItemId" TEXT,
  "inspectionId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DeliveryNoteRequest_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "DeliveryNoteRequest_status_idx" ON "DeliveryNoteRequest"("status");
CREATE INDEX IF NOT EXISTS "DeliveryNoteRequest_jobOrderId_idx" ON "DeliveryNoteRequest"("jobOrderId");
CREATE INDEX IF NOT EXISTS "DeliveryNoteRequest_inspectionId_idx" ON "DeliveryNoteRequest"("inspectionId");

-- Foreign keys
ALTER TABLE "DeliveryNoteRequest"
  ADD CONSTRAINT "DeliveryNoteRequest_jobOrderId_fkey"
  FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryNoteRequest"
  ADD CONSTRAINT "DeliveryNoteRequest_jobOrderItemId_fkey"
  FOREIGN KEY ("jobOrderItemId") REFERENCES "JobOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryNoteRequest"
  ADD CONSTRAINT "DeliveryNoteRequest_inspectionId_fkey"
  FOREIGN KEY ("inspectionId") REFERENCES "QualityInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
