-- One-time safety script to add any missing supplier-related columns
-- Run this in Supabase SQL Editor (idempotent: guarded by IF NOT EXISTS)

-- SupplierCertification columns
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

-- SupplierReference columns
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

-- SupplierBankDetails columns (includes swift)
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

-- SupplierPrice currency column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'SupplierPrice' AND column_name = 'currency'
    ) THEN
        ALTER TABLE "SupplierPrice" ADD COLUMN "currency" TEXT DEFAULT 'QAR';
        UPDATE "SupplierPrice" SET "currency" = 'QAR' WHERE "currency" IS NULL;
        ALTER TABLE "SupplierPrice" ALTER COLUMN "currency" SET NOT NULL;
    END IF;
END$$;

-- Notification columns (covers approval email flow)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'channel'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "channel" TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'to'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "to" TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'status'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "status" TEXT DEFAULT 'PENDING';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'providerResult'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "providerResult" JSONB;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'sentAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "sentAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT now();
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Notification' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT now();
    END IF;
END$$;
