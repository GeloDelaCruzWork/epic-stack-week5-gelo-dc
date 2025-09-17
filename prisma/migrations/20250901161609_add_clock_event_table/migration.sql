-- CreateTable
CREATE TABLE "public"."ClockEvent" (
    "id" TEXT NOT NULL,
    "clockTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timelogId" TEXT NOT NULL,

    CONSTRAINT "ClockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClockEvent_timelogId_idx" ON "public"."ClockEvent"("timelogId");

-- AddForeignKey
ALTER TABLE "public"."ClockEvent" ADD CONSTRAINT "ClockEvent_timelogId_fkey" FOREIGN KEY ("timelogId") REFERENCES "public"."Timelog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
