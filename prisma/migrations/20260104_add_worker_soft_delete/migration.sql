-- AlterTable
ALTER TABLE "Worker" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT;

-- CreateIndex
CREATE INDEX "Worker_isDeleted_idx" ON "Worker"("isDeleted");
