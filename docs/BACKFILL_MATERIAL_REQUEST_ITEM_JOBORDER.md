Backfill MaterialRequestItem.jobOrderId

Purpose
- Populate the new `jobOrderId` column on `MaterialRequestItem` for existing rows.

Steps (SQL)
1. Run the SQL in `prisma/migrations/20251225_backfill_item_joborder/migration.sql` against your database. It performs:
   - `UPDATE` from parent `MaterialRequest.jobOrderId` where present
   - `UPDATE` by matching `reasonForRequest` text to `JobOrder.jobNumber` (best-effort)
   - a summary SELECT that shows counts added per job

Example (psql)
  psql <connection-string> -f prisma/migrations/20251225_backfill_item_joborder/migration.sql

Steps (Node script)
1. Ensure you have `ts-node` installed (optional). Run locally:
  npx ts-node scripts/backfill_item_joborder.ts

Notes & Caveats
- The text match is heuristic: it searches for presence of the `jobNumber` substring in `reasonForRequest`. This may introduce a small number of false matches; inspect the summary output and run a few spot checks.
- The script is idempotent. Re-running it is safe.
- After backfill, consider re-indexing if your DB requires it and run application smoke tests to confirm material counts match expectations.

If you want, I can run the backfill for you if you provide a temporary read-write DB URL (option B). Otherwise you can run the SQL yourself and paste the summary results here and I'll verify.