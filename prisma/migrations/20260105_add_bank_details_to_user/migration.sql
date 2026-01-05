-- Add bankDetails field to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankDetails" TEXT;
