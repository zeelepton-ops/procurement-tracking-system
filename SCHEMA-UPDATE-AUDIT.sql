-- Add audit fields to JobOrder table
ALTER TABLE "JobOrder" 
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP WITH TIME ZONE;

-- Create JobOrderEditHistory table
CREATE TABLE IF NOT EXISTS "JobOrderEditHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobOrderId" TEXT NOT NULL,
  "editedBy" TEXT NOT NULL,
  "editedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "changesMade" TEXT NOT NULL,
  FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE CASCADE
);

-- Add audit fields to MaterialRequest table  
ALTER TABLE "MaterialRequest"
ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP WITH TIME ZONE;

-- Create MaterialRequestEditHistory table
CREATE TABLE IF NOT EXISTS "MaterialRequestEditHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "materialRequestId" TEXT NOT NULL,
  "editedBy" TEXT NOT NULL,
  "editedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "changesMade" TEXT NOT NULL,
  FOREIGN KEY ("materialRequestId") REFERENCES "MaterialRequest"("id") ON DELETE CASCADE
);

-- Add audit fields to ProcurementAction table
ALTER TABLE "ProcurementAction"
ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedBy" TEXT,
ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP WITH TIME ZONE;

-- Create ProcurementActionEditHistory table
CREATE TABLE IF NOT EXISTS "ProcurementActionEditHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "procurementActionId" TEXT NOT NULL,
  "editedBy" TEXT NOT NULL,
  "editedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "changesMade" TEXT NOT NULL,
  FOREIGN KEY ("procurementActionId") REFERENCES "ProcurementAction"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "JobOrderEditHistory_jobOrderId_idx" ON "JobOrderEditHistory"("jobOrderId");
CREATE INDEX IF NOT EXISTS "MaterialRequestEditHistory_materialRequestId_idx" ON "MaterialRequestEditHistory"("materialRequestId");
CREATE INDEX IF NOT EXISTS "ProcurementActionEditHistory_procurementActionId_idx" ON "ProcurementActionEditHistory"("procurementActionId");
