-- Backfill item.jobOrderId from parent material requests and reason text
BEGIN;

-- 1) Set item.jobOrderId = parent MR.jobOrderId where available
UPDATE "MaterialRequestItem" mri
SET "jobOrderId" = mr."jobOrderId"
FROM "MaterialRequest" mr
WHERE mri."jobOrderId" IS NULL
  AND mr.id = mri."materialRequestId"
  AND mr."jobOrderId" IS NOT NULL;

-- 2) Set item.jobOrderId from reasonForRequest matching job number (best-effort textual match)
UPDATE "MaterialRequestItem" mri
SET "jobOrderId" = jo.id
FROM "JobOrder" jo
WHERE mri."jobOrderId" IS NULL
  AND mri."reasonForRequest" IS NOT NULL
  AND mri."reasonForRequest" ILIKE '%' || jo."jobNumber" || '%';

COMMIT;

-- Show summary of updates
SELECT jo."jobNumber", COUNT(*) AS item_count
FROM "MaterialRequestItem" mri
JOIN "JobOrder" jo ON jo.id = mri."jobOrderId"
GROUP BY jo."jobNumber"
ORDER BY item_count DESC;