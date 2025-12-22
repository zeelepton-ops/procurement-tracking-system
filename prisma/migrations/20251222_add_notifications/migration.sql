-- Add attachments to EnquiryResponse and create Notification table

ALTER TABLE "EnquiryResponse" ADD COLUMN "attachments" JSON;

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enquiryId" TEXT,
  "supplierId" TEXT,
  "channel" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerResult" JSON,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;