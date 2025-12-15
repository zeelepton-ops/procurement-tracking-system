-- Add scopeOfWorks column to JobOrder for storing selected work types
ALTER TABLE "JobOrder" ADD COLUMN "scopeOfWorks" TEXT;
