-- =================================================================
-- DELIVERY NOTE MIGRATIONS FOR PRODUCTION DATABASE
-- Run this SQL script in Supabase SQL Editor
-- =================================================================

-- Step 1: Create DeliveryNote table
CREATE TABLE IF NOT EXISTS "DeliveryNote" (
    "id" TEXT NOT NULL,
    "deliveryNoteNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobOrderId" TEXT,
    "client" TEXT,
    "country" TEXT,
    "division" TEXT,
    "department" TEXT,
    "refPoNumber" TEXT,
    "jobSalesOrder" TEXT,
    "shipmentTo" TEXT,
    "totalQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comments" TEXT,
    "shipmentType" TEXT,
    "representativeName" TEXT,
    "representativeNo" TEXT,
    "qidNumber" TEXT,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'NBTC',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create DeliveryNoteItem table
CREATE TABLE IF NOT EXISTS "DeliveryNoteItem" (
    "id" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "jobOrderItemId" TEXT,
    "itemDescription" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "deliveredQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNoteItem_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique index on deliveryNoteNumber
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryNote_deliveryNoteNumber_key" ON "DeliveryNote"("deliveryNoteNumber");

-- Step 4: Create index on jobOrderId
CREATE INDEX IF NOT EXISTS "DeliveryNote_jobOrderId_idx" ON "DeliveryNote"("jobOrderId");

-- Step 5: Create index on status
CREATE INDEX IF NOT EXISTS "DeliveryNote_status_idx" ON "DeliveryNote"("status");

-- Step 6: Create index on deliveryNoteId
CREATE INDEX IF NOT EXISTS "DeliveryNoteItem_deliveryNoteId_idx" ON "DeliveryNoteItem"("deliveryNoteId");

-- Step 7: Add foreign key constraint from DeliveryNote to JobOrder
ALTER TABLE "DeliveryNote" 
    DROP CONSTRAINT IF EXISTS "DeliveryNote_jobOrderId_fkey";

ALTER TABLE "DeliveryNote" 
    ADD CONSTRAINT "DeliveryNote_jobOrderId_fkey" 
    FOREIGN KEY ("jobOrderId") 
    REFERENCES "JobOrder"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Step 8: Add foreign key constraint from DeliveryNoteItem to DeliveryNote
ALTER TABLE "DeliveryNoteItem" 
    DROP CONSTRAINT IF EXISTS "DeliveryNoteItem_deliveryNoteId_fkey";

ALTER TABLE "DeliveryNoteItem" 
    ADD CONSTRAINT "DeliveryNoteItem_deliveryNoteId_fkey" 
    FOREIGN KEY ("deliveryNoteId") 
    REFERENCES "DeliveryNote"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Verification query
SELECT 
    'DeliveryNote' as table_name, 
    COUNT(*) as row_count 
FROM "DeliveryNote"
UNION ALL
SELECT 
    'DeliveryNoteItem' as table_name, 
    COUNT(*) as row_count 
FROM "DeliveryNoteItem";
