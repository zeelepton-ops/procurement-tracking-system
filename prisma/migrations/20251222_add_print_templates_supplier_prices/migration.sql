-- Add PrintTemplate, SupplierPrice, POPreparation, SupplierQuote

ALTER TABLE "Supplier" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "leadTimeDays" INTEGER;
ALTER TABLE "Supplier" ADD COLUMN "defaultCurrency" TEXT DEFAULT 'QAR';
ALTER TABLE "Supplier" ADD COLUMN "taxId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "bankDetails" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "website" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "preferred" BOOLEAN DEFAULT false;
ALTER TABLE "Supplier" ADD COLUMN "notes" TEXT;

CREATE TABLE "PrintTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "htmlTemplate" TEXT NOT NULL,
  "mapping" JSON,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SupplierPrice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "itemKey" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'QAR',
  "effectiveFrom" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "POPreparation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdBy" TEXT NOT NULL,
  "items" JSON NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SupplierQuote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prepId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "quoteJson" TEXT NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill defaults
UPDATE "Supplier" SET "defaultCurrency" = 'QAR' WHERE "defaultCurrency" IS NULL;
