-- Create SystemSetting table for admin-managed configuration (e.g., SMTP)
CREATE TABLE "SystemSetting" (
    "key" TEXT PRIMARY KEY,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
