-- Add finalTotal to JobOrder to allow clients to specify total without per-line quantities
ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "finalTotal" DOUBLE PRECISION;