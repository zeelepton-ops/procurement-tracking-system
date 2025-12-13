-- Add MaterialRequestItem table for multi-item support
-- Execute this in Supabase SQL Editor

-- Create MaterialRequestItem table
CREATE TABLE IF NOT EXISTS "MaterialRequestItem" (
  "id" TEXT PRIMARY KEY,
  "materialRequestId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "stockQtyInInventory" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialRequestItem_materialRequestId_fkey" 
    FOREIGN KEY ("materialRequestId") 
    REFERENCES "MaterialRequest"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "MaterialRequestItem_materialRequestId_idx" 
  ON "MaterialRequestItem"("materialRequestId");

-- Migration complete
-- After running this, execute: npx prisma generate
