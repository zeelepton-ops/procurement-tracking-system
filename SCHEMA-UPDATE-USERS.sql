-- Update User table with additional fields and approval system

-- Add new columns to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "qid" TEXT,
ADD COLUMN IF NOT EXISTS "joiningDate" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "department" TEXT,
ADD COLUMN IF NOT EXISTS "position" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

-- Update default role from ADMIN to USER for new users
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Make info@nbtcqatar.com ADMIN and APPROVED
UPDATE "User" 
SET 
  "role" = 'ADMIN',
  "status" = 'APPROVED',
  "approvedBy" = 'system',
  "approvedAt" = NOW(),
  "isActive" = TRUE
WHERE "email" = 'info@nbtcqatar.com';

-- Update existing users to APPROVED status if not already set
UPDATE "User" 
SET 
  "status" = 'APPROVED',
  "approvedBy" = 'system',
  "approvedAt" = NOW()
WHERE "status" IS NULL OR "status" = '';

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_email_lower_idx" ON "User"(LOWER("email"));
