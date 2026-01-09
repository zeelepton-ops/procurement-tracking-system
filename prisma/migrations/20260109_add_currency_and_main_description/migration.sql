-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'QAR';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "mainDescription" TEXT;
