-- Schema Verification Queries (post consolidated migration)
-- Run in Supabase SQL Editor. Safe, read-only checks.

SET search_path = public;

-- Enquiry table: columns + FK
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Enquiry' AND column_name IN ('prepId','createdBy');

SELECT conname, conrelid::regclass AS table, confrelid::regclass AS references
FROM pg_constraint
WHERE conname = 'Enquiry_prepId_fkey';

-- SupplierQuote: columns, FKs, indexes
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'SupplierQuote' AND column_name IN ('prepId','supplierId');

SELECT conname, conrelid::regclass AS table, confrelid::regclass AS references
FROM pg_constraint
WHERE conname IN ('SupplierQuote_prepId_fkey','SupplierQuote_supplierId_fkey')
ORDER BY conname;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'SupplierQuote' AND indexname IN ('SupplierQuote_prepId_idx','SupplierQuote_supplierId_idx')
ORDER BY indexname;

-- Check for potential nullability mismatches with Prisma schema
SELECT COUNT(*) AS enquiry_prepid_nulls FROM "Enquiry" WHERE "prepId" IS NULL;
SELECT COUNT(*) AS enquiry_createdby_nulls FROM "Enquiry" WHERE "createdBy" IS NULL;
SELECT COUNT(*) AS supplierquote_prepid_nulls FROM "SupplierQuote" WHERE "prepId" IS NULL;

-- MaterialRequestItem: jobOrderId presence, FK, index
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'MaterialRequestItem' AND column_name = 'jobOrderId';

SELECT conname, conrelid::regclass AS table, confrelid::regclass AS references
FROM pg_constraint
WHERE conname = 'MaterialRequestItem_jobOrderId_fkey';

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'MaterialRequestItem' AND indexname = 'MaterialRequestItem_jobOrderId_idx';

-- JobOrder unique index on (jobNumber, isDeleted)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'JobOrder' AND indexname = 'JobOrder_jobNumber_isDeleted_unique';

-- Supplier.status enum type present
SELECT t.typname AS type_name, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'SupplierStatus'
ORDER BY e.enumsortorder;

-- Backfill outcome: items linked to job orders
SELECT COUNT(*) AS items_with_joborder
FROM "MaterialRequestItem"
WHERE "jobOrderId" IS NOT NULL;

SELECT jo."jobNumber", COUNT(*) AS item_count
FROM "MaterialRequestItem" mri
JOIN "JobOrder" jo ON jo.id = mri."jobOrderId"
GROUP BY jo."jobNumber"
ORDER BY item_count DESC
LIMIT 10;
