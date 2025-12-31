-- Workers Transportation Scheduling Tables Migration
-- Run this in Supabase SQL Editor

-- Create Worker table
CREATE TABLE IF NOT EXISTS "Worker" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "qid" TEXT UNIQUE,
  "phone" TEXT,
  "shift" TEXT NOT NULL DEFAULT 'DAY',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "department" TEXT,
  "position" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Vehicle table
CREATE TABLE IF NOT EXISTS "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "vehicleNumber" TEXT UNIQUE NOT NULL,
  "vehicleName" TEXT,
  "seats" INTEGER NOT NULL DEFAULT 0,
  "vehicleType" TEXT,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "driver" TEXT,
  "driverPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TransportSchedule table
CREATE TABLE IF NOT EXISTS "TransportSchedule" (
  "id" TEXT PRIMARY KEY,
  "date" TIMESTAMP(3) NOT NULL,
  "shift" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "pickupTime" TEXT,
  "dropTime" TEXT,
  "route" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransportSchedule_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TransportSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for TransportSchedule
CREATE INDEX IF NOT EXISTS "TransportSchedule_date_shift_idx" ON "TransportSchedule"("date", "shift");
CREATE INDEX IF NOT EXISTS "TransportSchedule_workerId_idx" ON "TransportSchedule"("workerId");
CREATE INDEX IF NOT EXISTS "TransportSchedule_vehicleId_idx" ON "TransportSchedule"("vehicleId");

-- Add comments
COMMENT ON TABLE "Worker" IS 'Workers information for transportation scheduling';
COMMENT ON TABLE "Vehicle" IS 'Vehicles available for worker transportation';
COMMENT ON TABLE "TransportSchedule" IS 'Transportation schedules assigning workers to vehicles';
