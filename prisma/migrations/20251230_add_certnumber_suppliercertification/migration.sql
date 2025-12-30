-- Ensure SupplierCertification has certNumber column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'SupplierCertification'
          AND column_name = 'certNumber'
    ) THEN
        ALTER TABLE "SupplierCertification" ADD COLUMN "certNumber" TEXT;
    END IF;
END$$;
