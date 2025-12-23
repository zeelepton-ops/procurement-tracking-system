-- Add soft delete fields to MaterialRequestItem
ALTER TABLE "MaterialRequestItem" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MaterialRequestItem" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "MaterialRequestItem" ADD COLUMN "deletedBy" TEXT;
