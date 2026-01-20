/*
  Warnings:

  - You are about to drop the column `locationId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_locationId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "locationId";

-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "locationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "locationId";

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
