-- Add createdBy and updatedBy columns to Supplier table
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
