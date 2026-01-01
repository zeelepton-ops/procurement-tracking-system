import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Run each statement separately to avoid "cannot insert multiple commands" error
    const statements = [
      `CREATE TABLE IF NOT EXISTS "Worker" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "qid" TEXT NOT NULL UNIQUE,
        "qidExpiryDate" TIMESTAMP(3),
        "passportNo" TEXT NOT NULL UNIQUE,
        "passportExpiryDate" TIMESTAMP(3),
        "profession" TEXT NOT NULL,
        "visaCategory" TEXT NOT NULL,
        "accommodationAddress" TEXT,
        "permanentAddress" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "joiningDate" TIMESTAMP(3) NOT NULL,
        "exitDate" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "allottedShift" TEXT,
        "internalCompanyShift" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS "Worker_qid_idx" ON "Worker"("qid");`,
      `CREATE INDEX IF NOT EXISTS "Worker_passportNo_idx" ON "Worker"("passportNo");`,
      `CREATE INDEX IF NOT EXISTS "Worker_status_idx" ON "Worker"("status");`,
      `CREATE TABLE IF NOT EXISTS "WorkerAttendance" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workerId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "checkIn" TIMESTAMP(3),
        "checkOut" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'PRESENT',
        "workHours" DOUBLE PRECISION,
        "overtimeHours" DOUBLE PRECISION,
        "notes" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WorkerAttendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "WorkerAttendance_workerId_idx" ON "WorkerAttendance"("workerId");`,
      `CREATE INDEX IF NOT EXISTS "WorkerAttendance_date_idx" ON "WorkerAttendance"("date");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "WorkerAttendance_workerId_date_key" ON "WorkerAttendance"("workerId", "date");`,
      `CREATE TABLE IF NOT EXISTS "WorkerSalary" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workerId" TEXT NOT NULL,
        "month" TEXT NOT NULL,
        "basicSalary" DOUBLE PRECISION NOT NULL,
        "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "overtimePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalSalary" DOUBLE PRECISION NOT NULL,
        "paidDate" TIMESTAMP(3),
        "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "paymentMethod" TEXT,
        "notes" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WorkerSalary_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "WorkerSalary_workerId_idx" ON "WorkerSalary"("workerId");`,
      `CREATE INDEX IF NOT EXISTS "WorkerSalary_month_idx" ON "WorkerSalary"("month");`,
      `CREATE INDEX IF NOT EXISTS "WorkerSalary_paymentStatus_idx" ON "WorkerSalary"("paymentStatus");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "WorkerSalary_workerId_month_key" ON "WorkerSalary"("workerId", "month");`,
      `CREATE TABLE IF NOT EXISTS "WorkerAuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workerId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "field" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "description" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkerAuditLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE INDEX IF NOT EXISTS "WorkerAuditLog_workerId_idx" ON "WorkerAuditLog"("workerId");`,
      `CREATE INDEX IF NOT EXISTS "WorkerAuditLog_createdAt_idx" ON "WorkerAuditLog"("createdAt");`
    ]

    // Run all statements in a transaction to keep things consistent
    await prisma.$transaction(statements.map((sql) => prisma.$executeRawUnsafe(sql)))

    // Verify tables were created by running a simple query
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Worker"`
      return NextResponse.json({
        success: true,
        message: 'Worker tables initialized successfully. You can now add workers!'
      })
    } catch (verifyError: any) {
      if (verifyError.code === 'P2021') {
        return NextResponse.json({
          success: false,
          error: 'Tables still not accessible after creation attempt',
          hint: 'Please try refreshing the page or contact support'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Worker tables are ready (already existed). You can start adding workers!'
      })
    }
  } catch (error: any) {
    console.error('Failed to initialize worker tables:', error)

    if (error.message?.includes('already exists') || error.code === '42P07') {
      return NextResponse.json({
        success: true,
        message: 'Worker tables are ready (already existed). You can start adding workers!'
      })
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      hint: 'Database connection issue or permission problem. Please try again or contact support.'
    }, { status: 500 })
  }
}
