# Prisma Schema Hardening & Schema-Drift Prevention ✅

## Summary

We observed runtime Prisma P2022 errors (e.g., "column `JobOrder.clientContactPerson` does not exist") which caused API handlers to fail when Prisma Client expected fields that weren't present in the database.

Root causes:
- Prisma schema and DB schema drift (migrations not applied to the production DB)
- Manual edits or partial migrations in DB without committed migrations
- Missing post-deploy migration step or CI check before app runs

This document describes immediate mitigations, long-term fixes, automation, and monitoring strategies to prevent similar P2022 errors in the future.

---

## Immediate - What to do now ⚡
1. Run an idempotent SQL migration to add missing columns for the reported model(s) (safe approach uses `IF NOT EXISTS`). Example for `JobOrder` (paste to Supabase SQL editor):

```sql
-- Add missing JobOrder columns (safe - idempotent)
BEGIN;
ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "clientContactPerson" TEXT;
-- ... (other ALTER TABLE statements) ...
COMMIT;
```

2. Re-run the operation that triggered the P2022 error (e.g., POST `/api/job-orders`) and confirm success.
3. Keep an explicit Prisma migration file in the repo (e.g., add migration SQL under `prisma/migrations/`) so the change is tracked in version control.

---

## Root-cause fixes (recommended) ✅
- Always create and commit Prisma migrations (via `prisma migrate dev` / `prisma migrate deploy`) instead of manually altering DBs.
- Ensure the deployment process runs migrations against the target DB before starting the app server.
- Maintain the `prisma/migrations` folder in source control and keep migrations immutable.

Commands:
```bash
# generate a migration locally (dev) and keep SQL in repo
npx prisma migrate dev --name "describe-change"

# apply migrations on the server/CI (deploy)
npx prisma migrate deploy
```

---

## Automation & CI checks (strongly recommended) 🔁
Add CI steps that run before production deploy:
- `npx prisma migrate deploy` (applies migrations; fails deploy if migrations missing)
- `npx prisma db pull` + `npx prisma db diff` or custom script to ensure that the DB and `schema.prisma` are in sync
- Run a SQL-based schema checker that lists missing columns (idempotent SQL; sample provided below)

Example GitHub Actions job snippet (conceptual):
```yml
jobs:
  db-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install deps
        run: npm ci
      - name: Validate migrations
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: |
          npx prisma migrate deploy --schema=prisma/schema.prisma
          # Optionally run a SQL check here (see 'Schema-wide checker' below)
```

---

## Schema-wide checker SQL (safe)
Use this in your SQL editor to list missing columns (we used a similar query already). It reports table/column/presence so you can fix gaps before production failures.

(Example snippet available in repo in `docs/` or from the issue history.)

---

## Temporary runtime fallback: use sparingly ⚠️
- The codebase may add defensive `try/catch` that catches Prisma `P2022` and attempts `ALTER TABLE ADD COLUMN IF NOT EXISTS` then retries the query. This *works* short-term but is not recommended for the long term because:
  - It hides schema drift rather than enforcing correct migrations
  - It may produce inconsistent DB states across replicas
  - It makes debugging harder and can mask missing indexes or constraints

Use this approach only as an emergency auto-remediation while you apply permanent migrations.

---

## Monitoring & Alerts 📣
- Add monitoring for Prisma errors (P2022) — wire app logs to Sentry / Datadog / Papertrail and create an alert on error keyword `P2022` or `PrismaClientKnownRequestError`.
- On an alert, block new deployments until the migration is applied and verified.

---

## Developer best practices ✍️
- When changing `schema.prisma`, always `prisma migrate dev` locally and commit the migration files.
- Avoid manual `ALTER TABLE` outside of migrations; if needed, create a migration file after applying changes to DB.
- Add a pre-deploy step to run `npx prisma migrate deploy` in CI.
- Run the schema-wide checker periodically (cron job or scheduled CI) for early detection.

---

## Example helper: idempotent ALTER SQL snippet
Below is a sample you can copy to Supabase or run as a migration file (idempotent due to `IF NOT EXISTS`):

```sql
ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "clientContactPerson" TEXT;
ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "clientContactPhone" TEXT;
ALTER TABLE "JobOrder" ADD COLUMN IF NOT EXISTS "jobNumber" TEXT;
-- Add other needed columns similarly
```

---

## Where this file lives
- This document: `docs/PRISMA_SCHEMA_HARDENING.md`
- Helpful scripts: `prisma/migrations/*` (commit migrations)
- Quick-check SQL snippets: keep a copy under `scripts/` if you want scheduled checks.

---

If you'd like, I can also:
- Add a GitHub Action workflow in `.github/workflows/` to run `prisma migrate deploy` and the schema checker before promoting to production, or
- Create a small script `scripts/check-schema.js` that connects to DB and compares `schema.prisma` with `information_schema` to produce a report.

Tell me which follow-up you want (Action workflow, script, or both) and I'll add it.
