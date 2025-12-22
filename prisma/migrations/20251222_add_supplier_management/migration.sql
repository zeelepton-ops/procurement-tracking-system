-- Create supplier management tables

CREATE TABLE "SupplierContact" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "isPrimary" BOOLEAN DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_supplier_contact FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE
);

CREATE TABLE "SupplierCapability" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "details" TEXT,
  "capacity" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_supplier_capability FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE
);

CREATE TABLE "SupplierDocument" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "uploadedBy" TEXT,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  CONSTRAINT fk_supplier_document FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE
);

CREATE TABLE "SupplierCertification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "certNumber" TEXT,
  "issuedBy" TEXT,
  "validFrom" TIMESTAMP WITH TIME ZONE,
  "validTo" TIMESTAMP WITH TIME ZONE,
  "documentId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_supplier_cert_supplier FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE,
  CONSTRAINT fk_supplier_cert_doc FOREIGN KEY ("documentId") REFERENCES "SupplierDocument"(id) ON DELETE SET NULL
);

CREATE TABLE "SupplierReference" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "projectName" TEXT,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_supplier_reference FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE
);

CREATE TABLE "SupplierBankDetails" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplierId" TEXT UNIQUE NOT NULL,
  "bankName" TEXT,
  "accountName" TEXT,
  "iban" TEXT,
  "swift" TEXT,
  "currency" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_supplier_bank FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE CASCADE
);

-- Optional indexes
CREATE INDEX idx_suppliercontact_supplierid ON "SupplierContact" ("supplierId");
CREATE INDEX idx_suppliercapability_supplierid ON "SupplierCapability" ("supplierId");
CREATE INDEX idx_supplierdocument_supplierid ON "SupplierDocument" ("supplierId");
CREATE INDEX idx_suppliercert_supplierid ON "SupplierCertification" ("supplierId");
CREATE INDEX idx_supplierref_supplierid ON "SupplierReference" ("supplierId");
CREATE INDEX idx_supplierbank_supplierid ON "SupplierBankDetails" ("supplierId");
