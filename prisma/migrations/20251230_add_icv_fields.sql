-- Add ICV Score, Certificate Number, and Expiry Date fields to Supplier table
-- Migration: 20251230_add_icv_fields
-- Description: Adds ICV Score, ICV Certificate Number, and ICV Expiry Date to support ICV certification tracking

DO $$ 
BEGIN
  -- Add icvScore column (Float for percentage value)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Supplier' AND column_name = 'icvScore'
  ) THEN
    ALTER TABLE "Supplier" ADD COLUMN "icvScore" DOUBLE PRECISION;
  END IF;

  -- Add icvCertificateNumber column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Supplier' AND column_name = 'icvCertificateNumber'
  ) THEN
    ALTER TABLE "Supplier" ADD COLUMN "icvCertificateNumber" TEXT;
  END IF;

  -- Add icvExpiry column (DateTime for expiry date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Supplier' AND column_name = 'icvExpiry'
  ) THEN
    ALTER TABLE "Supplier" ADD COLUMN "icvExpiry" TIMESTAMP(3);
  END IF;
END $$;
