-- Ensure SupplierReference has all expected columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'clientName'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "clientName" TEXT NOT NULL DEFAULT 'UNKNOWN';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'projectName'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "projectName" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'contactName'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "contactName" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'contactPhone'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "contactPhone" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'notes'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "notes" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierReference' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "SupplierReference" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT now();
    END IF;
END$$;
