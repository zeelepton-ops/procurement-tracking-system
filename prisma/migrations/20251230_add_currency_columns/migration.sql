-- Add currency column to SupplierPrice if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SupplierPrice'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE "SupplierPrice" ADD COLUMN "currency" TEXT DEFAULT 'QAR';
        -- For existing rows, set default value
        UPDATE "SupplierPrice" SET "currency" = 'QAR' WHERE "currency" IS NULL;
        ALTER TABLE "SupplierPrice" ALTER COLUMN "currency" SET NOT NULL;
    END IF;
END$$;

-- Add currency column to SupplierBankDetails if missing (used in API payload mapping)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SupplierBankDetails'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "currency" TEXT;
    END IF;
END$$;
