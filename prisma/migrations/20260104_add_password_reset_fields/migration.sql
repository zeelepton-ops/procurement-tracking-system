-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resetRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_resetTokenHash_key" ON "User"("resetTokenHash");
