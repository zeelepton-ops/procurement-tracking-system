-- Add requestContext and flexible relations to MaterialRequest
ALTER TABLE "MaterialRequest" 
ADD COLUMN "requestContext" TEXT NOT NULL DEFAULT 'JOB_ORDER',
ADD COLUMN "assetId" TEXT;

-- Make jobOrderId nullable
ALTER TABLE "MaterialRequest" 
ALTER COLUMN "jobOrderId" DROP NOT NULL;

-- Create Asset table
CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "location" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Asset_code_key" UNIQUE ("code")
);

-- Add inventoryItemId to MaterialRequestItem
ALTER TABLE "MaterialRequestItem" 
ADD COLUMN "inventoryItemId" TEXT;

-- Add foreign key constraints
ALTER TABLE "MaterialRequest" 
ADD CONSTRAINT "MaterialRequest_assetId_fkey" 
FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaterialRequestItem" 
ADD CONSTRAINT "MaterialRequestItem_inventoryItemId_fkey" 
FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for faster lookups
CREATE INDEX "Material Request_requestContext_idx" ON "MaterialRequest"("requestContext");
CREATE INDEX "Asset_code_idx" ON "Asset"("code");
