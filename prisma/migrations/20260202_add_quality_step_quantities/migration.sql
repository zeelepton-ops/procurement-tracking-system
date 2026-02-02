-- Add quantity tracking fields to QualityStep
ALTER TABLE "QualityStep" ADD COLUMN "approvedQty" DOUBLE PRECISION;
ALTER TABLE "QualityStep" ADD COLUMN "failedQty" DOUBLE PRECISION;
ALTER TABLE "QualityStep" ADD COLUMN "holdQty" DOUBLE PRECISION;
