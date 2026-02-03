-- AlterTable
ALTER TABLE "JobOrderItem" ADD COLUMN "unitWeight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ProductionRelease" (
    "id" TEXT NOT NULL,
    "jobOrderItemId" TEXT NOT NULL,
    "drawingNumber" TEXT,
    "releaseQty" DOUBLE PRECISION NOT NULL,
    "releaseWeight" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "productionStartDate" TIMESTAMP(3),
    "productionEndDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "itpTemplateId" TEXT,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredQty" DOUBLE PRECISION,
    "deliveryNoteId" TEXT,
    "inspectionCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionInspection" (
    "id" TEXT NOT NULL,
    "productionReleaseId" TEXT NOT NULL,
    "inspectionNumber" INTEGER NOT NULL DEFAULT 1,
    "requestTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionTimestamp" TIMESTAMP(3),
    "result" TEXT,
    "remarks" TEXT,
    "inspectedBy" TEXT,
    "inspectedQty" DOUBLE PRECISION,
    "approvedQty" DOUBLE PRECISION,
    "rejectedQty" DOUBLE PRECISION,
    "holdQty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionRelease_jobOrderItemId_idx" ON "ProductionRelease"("jobOrderItemId");

-- CreateIndex
CREATE INDEX "ProductionRelease_status_idx" ON "ProductionRelease"("status");

-- CreateIndex
CREATE INDEX "ProductionInspection_productionReleaseId_idx" ON "ProductionInspection"("productionReleaseId");

-- CreateIndex
CREATE INDEX "ProductionInspection_result_idx" ON "ProductionInspection"("result");

-- AddForeignKey
ALTER TABLE "ProductionRelease" ADD CONSTRAINT "ProductionRelease_jobOrderItemId_fkey" FOREIGN KEY ("jobOrderItemId") REFERENCES "JobOrderItem"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRelease" ADD CONSTRAINT "ProductionRelease_itpTemplateId_fkey" FOREIGN KEY ("itpTemplateId") REFERENCES "ITPTemplate"("id") ON DELETE SET NULL;

-- AddForeignKey
ALTER TABLE "ProductionInspection" ADD CONSTRAINT "ProductionInspection_productionReleaseId_fkey" FOREIGN KEY ("productionReleaseId") REFERENCES "ProductionRelease"("id") ON DELETE CASCADE;
