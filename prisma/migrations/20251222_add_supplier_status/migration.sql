-- Add Supplier.status enum and column

DO $$
BEGIN
    -- Create enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplierstatus') THEN
        CREATE TYPE "SupplierStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "status" "SupplierStatus" DEFAULT 'PENDING';

-- Set existing null statuses to PENDING
UPDATE "Supplier" SET "status" = 'PENDING' WHERE "status" IS NULL;
