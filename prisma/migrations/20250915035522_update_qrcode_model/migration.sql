/*
  Warnings:

  - Added the required column `detachment` to the `QRCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `QRCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `QRCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."QRCode" ADD COLUMN     "detachment" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;
