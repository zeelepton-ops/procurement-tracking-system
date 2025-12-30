-- Ensure SupplierCertification has all expected columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierCertification' AND column_name = 'certNumber'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "certNumber" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierCertification' AND column_name = 'issuedBy'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "issuedBy" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierCertification' AND column_name = 'validFrom'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "validFrom" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierCertification' AND column_name = 'validTo'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "validTo" TIMESTAMP(3);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierCertification' AND column_name = 'documentId'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "documentId" TEXT;
    END IF;
END$$;
