-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qid" TEXT NOT NULL,
    "qidExpiryDate" TIMESTAMP(3),
    "passportNo" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAttendance" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "WorkerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSalary" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "WorkerSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAuditLog" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Worker_qid_key" ON "Worker"("qid");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_passportNo_key" ON "Worker"("passportNo");

-- CreateIndex
CREATE INDEX "Worker_qid_idx" ON "Worker"("qid");

-- CreateIndex
CREATE INDEX "Worker_passportNo_idx" ON "Worker"("passportNo");

-- CreateIndex
CREATE INDEX "Worker_status_idx" ON "Worker"("status");

-- CreateIndex
CREATE INDEX "WorkerAttendance_workerId_idx" ON "WorkerAttendance"("workerId");

-- CreateIndex
CREATE INDEX "WorkerAttendance_date_idx" ON "WorkerAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAttendance_workerId_date_key" ON "WorkerAttendance"("workerId", "date");

-- CreateIndex
CREATE INDEX "WorkerSalary_workerId_idx" ON "WorkerSalary"("workerId");

-- CreateIndex
CREATE INDEX "WorkerSalary_month_idx" ON "WorkerSalary"("month");

-- CreateIndex
CREATE INDEX "WorkerSalary_paymentStatus_idx" ON "WorkerSalary"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerSalary_workerId_month_key" ON "WorkerSalary"("workerId", "month");

-- CreateIndex
CREATE INDEX "WorkerAuditLog_workerId_idx" ON "WorkerAuditLog"("workerId");

-- CreateIndex
CREATE INDEX "WorkerAuditLog_createdAt_idx" ON "WorkerAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkerAttendance" ADD CONSTRAINT "WorkerAttendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSalary" ADD CONSTRAINT "WorkerSalary_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAuditLog" ADD CONSTRAINT "WorkerAuditLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
