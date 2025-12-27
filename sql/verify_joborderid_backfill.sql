-- Verification queries for MaterialRequestItem.jobOrderId backfill
-- Run these in Supabase SQL Editor (set limit to "No limit")
-- All identifiers properly quoted for PostgreSQL camelCase

-- 1) Per-job item counts (spot-check top 50 jobs by item count)
-- Shows how many items are now linked to each job
SELECT 
  jo.id, 
  jo."jobNumber", 
  COUNT(mri.id) AS item_count
FROM "JobOrder" jo
LEFT JOIN "MaterialRequestItem" mri
  ON mri."jobOrderId" = jo.id 
  AND mri."isDeleted" = false
GROUP BY jo.id, jo."jobNumber"
ORDER BY item_count DESC
LIMIT 50;

-- 2) Sample material request items for job 6426
-- Replace '6426' with the job number you want to inspect
SELECT 
  mri.id,
  mri."itemName",
  mri.description,
  mri.quantity,
  mri.unit,
  mri."reasonForRequest",
  mri."jobOrderId",
  mr."requestNumber"
FROM "MaterialRequestItem" mri
LEFT JOIN "MaterialRequest" mr ON mr.id = mri."materialRequestId"
WHERE mri."jobOrderId" IN (
  SELECT id FROM "JobOrder" WHERE "jobNumber" = '6426'
)
LIMIT 20;

-- 3) Count of items still with NULL jobOrderId (should be low if backfill worked)
SELECT COUNT(*) as items_with_null_joborderid
FROM "MaterialRequestItem" 
WHERE "jobOrderId" IS NULL
  AND "isDeleted" = false;

-- 4) Total items linked by backfill (non-NULL jobOrderId)
SELECT COUNT(*) as items_with_joborderid
FROM "MaterialRequestItem"
WHERE "jobOrderId" IS NOT NULL
  AND "isDeleted" = false;

-- 5) Breakdown: items linked from parent MR vs. heuristic match
-- Items linked from parent MR.jobOrderId
SELECT COUNT(*) as linked_from_parent_mr
FROM "MaterialRequestItem" mri
WHERE mri."jobOrderId" IS NOT NULL
  AND mri."jobOrderId" IN (
    SELECT "jobOrderId" FROM "MaterialRequest" mr
    WHERE mr.id = mri."materialRequestId" AND mr."jobOrderId" IS NOT NULL
  );

-- 6) Sample of multi-line Material Requests with items linked to different jobs
SELECT 
  mr."requestNumber",
  COUNT(mri.id) as item_count,
  COUNT(DISTINCT mri."jobOrderId") as distinct_jobs,
  STRING_AGG(DISTINCT jo."jobNumber", ', ' ORDER BY jo."jobNumber") as job_numbers
FROM "MaterialRequest" mr
LEFT JOIN "MaterialRequestItem" mri ON mri."materialRequestId" = mr.id AND mri."isDeleted" = false
LEFT JOIN "JobOrder" jo ON jo.id = mri."jobOrderId"
WHERE mr."isDeleted" = false
GROUP BY mr.id, mr."requestNumber"
HAVING COUNT(DISTINCT mri."jobOrderId") > 1
LIMIT 20;
