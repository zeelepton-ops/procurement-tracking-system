-- Add jobOrderId to MaterialRequestItem (idempotent)
ALTER TABLE "MaterialRequestItem" ADD COLUMN IF NOT EXISTS "jobOrderId" TEXT;
-- Try to add an index to speed up counts
CREATE INDEX IF NOT EXISTS "MaterialRequestItem_jobOrderId_idx" ON "MaterialRequestItem"("jobOrderId");
-- (Optional) If JobOrder table exists, add a FK while being tolerant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'MaterialRequestItem' AND c.conname = 'MaterialRequestItem_jobOrderId_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"(id) ON DELETE SET NULL;
    EXCEPTION WHEN undefined_table OR duplicate_object THEN
      -- if JobOrder doesn't exist or constraint already exists, skip
      RAISE NOTICE 'Skipping FK addition: %', SQLERRM;
    END;
  END IF;
END$$;

-- Backfill notes are provided in a separate runbook script
