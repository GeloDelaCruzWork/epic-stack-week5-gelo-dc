-- CreateTable
CREATE TABLE "public"."Timelog" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dtrId" TEXT NOT NULL,

    CONSTRAINT "Timelog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timelog_dtrId_idx" ON "public"."Timelog"("dtrId");

-- AddForeignKey
ALTER TABLE "public"."Timelog" ADD CONSTRAINT "Timelog_dtrId_fkey" FOREIGN KEY ("dtrId") REFERENCES "public"."DTR"("id") ON DELETE CASCADE ON UPDATE CASCADE;
