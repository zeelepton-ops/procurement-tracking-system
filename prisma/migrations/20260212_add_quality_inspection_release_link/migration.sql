ALTER TABLE "QualityInspection"
ADD COLUMN "productionReleaseId" TEXT;

ALTER TABLE "QualityInspection"
ADD CONSTRAINT "QualityInspection_productionReleaseId_fkey"
FOREIGN KEY ("productionReleaseId") REFERENCES "ProductionRelease"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "QualityInspection_productionReleaseId_idx"
ON "QualityInspection"("productionReleaseId");
