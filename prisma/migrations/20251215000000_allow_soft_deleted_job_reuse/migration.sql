-- Drop the old unique constraint on jobNumber
ALTER TABLE "JobOrder" DROP CONSTRAINT "JobOrder_jobNumber_key";

-- Add new composite unique constraint on jobNumber and isDeleted
-- This allows soft-deleted (isDeleted=true) job numbers to be reused
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_jobNumber_isDeleted_key" UNIQUE ("jobNumber", "isDeleted");
