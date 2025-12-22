-- Add Enquiry and EnquiryResponse tables

CREATE TABLE "Enquiry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prepId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "supplierIds" JSON NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "EnquiryResponse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enquiryId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "quoteJson" JSON NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnquiryResponse_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EnquiryResponse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Link Enquiry.prepId -> POPreparation
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_prepId_fkey" FOREIGN KEY ("prepId") REFERENCES "POPreparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;