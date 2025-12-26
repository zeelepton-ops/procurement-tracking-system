-- AddColumn operations for PurchaseOrder soft delete and PurchaseOrderItem restructuring
-- This migration is idempotent

-- 1. Add soft-delete columns to PurchaseOrder if they don't exist
ALTER TABLE "PurchaseOrder" 
ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- 2. Drop old columns if they exist and add new ones for PurchaseOrderItem
ALTER TABLE "PurchaseOrderItem" 
DROP COLUMN IF EXISTS "deliveryStatus",
DROP COLUMN IF EXISTS "receivedQuantity",
DROP COLUMN IF EXISTS "orderedQuantity";

-- 3. Add new columns to PurchaseOrderItem if they don't exist
ALTER TABLE "PurchaseOrderItem"
ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'PCS';

-- 4. Create index for soft-deleted POs
CREATE INDEX IF NOT EXISTS "PurchaseOrder_isDeleted_idx" ON "PurchaseOrder"("isDeleted");

-- 5. Update PurchaseOrder.createdBy to be nullable if not already
ALTER TABLE "PurchaseOrder" ALTER COLUMN "createdBy" DROP NOT NULL;

-- 6. Drop totalAmount if it exists
ALTER TABLE "PurchaseOrder" DROP COLUMN IF EXISTS "totalAmount";
