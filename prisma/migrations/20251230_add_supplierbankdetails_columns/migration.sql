-- Ensure SupplierBankDetails has all expected columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'bankName'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "bankName" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'accountName'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "accountName" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'iban'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "iban" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'swift'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "swift" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'currency'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "currency" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'notes'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "notes" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierBankDetails' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "SupplierBankDetails" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT now();
    END IF;
END$$;
