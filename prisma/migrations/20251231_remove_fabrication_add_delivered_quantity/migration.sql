-- Remove fabrication column from DeliveryNote
ALTER TABLE "DeliveryNote" DROP COLUMN IF EXISTS "fabrication";

-- Add deliveredQuantity and jobOrderItemId to DeliveryNoteItem
ALTER TABLE "DeliveryNoteItem" 
  ADD COLUMN IF NOT EXISTS "deliveredQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "jobOrderItemId" TEXT;

-- Add index for deliveryNoteId
CREATE INDEX IF NOT EXISTS "DeliveryNoteItem_deliveryNoteId_idx" ON "DeliveryNoteItem"("deliveryNoteId");
