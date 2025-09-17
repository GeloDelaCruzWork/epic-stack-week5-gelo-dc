-- CreateTable
CREATE TABLE "public"."Timesheet" (
    "id" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "payPeriod" TEXT NOT NULL,
    "detachment" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);
