-- Add status field to MaterialRequestItem
ALTER TABLE "MaterialRequestItem" 
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Copy status from MaterialRequest to all its items for existing data
UPDATE "MaterialRequestItem" mri
SET status = mr.status
FROM "MaterialRequest" mr
WHERE mri."materialRequestId" = mr.id;
