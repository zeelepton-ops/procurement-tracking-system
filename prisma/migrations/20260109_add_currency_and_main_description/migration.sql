-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'QAR',
ADD COLUMN "mainDescription" TEXT;
