-- Enhance Supplier model with document URLs and business details
ALTER TABLE "Supplier" ADD COLUMN "category" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "businessType" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "yearEstablished" INTEGER;
ALTER TABLE "Supplier" ADD COLUMN "city" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "country" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "crNumber" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "crDocumentUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "taxCardUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "icvUrl" TEXT;
