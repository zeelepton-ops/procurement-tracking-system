-- Add discount and roundOff columns to JobOrder
ALTER TABLE "JobOrder" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "JobOrder" ADD COLUMN "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing rows if needed (defaults already set to 0)
UPDATE "JobOrder" SET "discount" = 0 WHERE "discount" IS NULL;
UPDATE "JobOrder" SET "roundOff" = 0 WHERE "roundOff" IS NULL;
