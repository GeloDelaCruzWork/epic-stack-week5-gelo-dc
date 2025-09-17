-- CreateTable
CREATE TABLE "public"."DTR" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightDifferential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timesheetId" TEXT NOT NULL,

    CONSTRAINT "DTR_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DTR_timesheetId_idx" ON "public"."DTR"("timesheetId");

-- AddForeignKey
ALTER TABLE "public"."DTR" ADD CONSTRAINT "DTR_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "public"."Timesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
