-- Quality Inspection System for Steel Fabrication QMS

CREATE TABLE "ITPTemplate" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "steps" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "QualityInspection" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "jobOrderItemId" TEXT NOT NULL,
    "itpTemplateId" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    FOREIGN KEY ("jobOrderItemId") REFERENCES "JobOrderItem"("id") ON DELETE CASCADE,
    FOREIGN KEY ("itpTemplateId") REFERENCES "ITPTemplate"("id")
);

CREATE TABLE "QualityStep" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "qualityInspectionId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "inspectedBy" TEXT,
    "inspectedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    FOREIGN KEY ("qualityInspectionId") REFERENCES "QualityInspection"("id") ON DELETE CASCADE
);

CREATE TABLE "QualityPhoto" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "qualityStepId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP DEFAULT now(),
    FOREIGN KEY ("qualityStepId") REFERENCES "QualityStep"("id") ON DELETE CASCADE
);
