-- Add missing columns to Supplier table
DO $$ 
BEGIN
  -- Add state and postalCode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='state') THEN
    ALTER TABLE "Supplier" ADD COLUMN "state" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='postalCode') THEN
    ALTER TABLE "Supplier" ADD COLUMN "postalCode" TEXT;
  END IF;
  
  -- Add numberOfEmployees
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='numberOfEmployees') THEN
    ALTER TABLE "Supplier" ADD COLUMN "numberOfEmployees" INTEGER;
  END IF;
  
  -- Add crExpiry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='crExpiry') THEN
    ALTER TABLE "Supplier" ADD COLUMN "crExpiry" TIMESTAMP(3);
  END IF;
  
  -- Add taxIdExpiry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='taxIdExpiry') THEN
    ALTER TABLE "Supplier" ADD COLUMN "taxIdExpiry" TIMESTAMP(3);
  END IF;
  
  -- Add minimumOrderValue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='minimumOrderValue') THEN
    ALTER TABLE "Supplier" ADD COLUMN "minimumOrderValue" DOUBLE PRECISION;
  END IF;
  
  -- Reorder taxId column if it exists in wrong position (move it before taxCardUrl)
  -- Note: PostgreSQL doesn't support column reordering, but we ensure it exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Supplier' AND column_name='taxId') THEN
    ALTER TABLE "Supplier" ADD COLUMN "taxId" TEXT;
  END IF;
END $$;
