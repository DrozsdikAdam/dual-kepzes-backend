/*
  Warnings:

  - You are about to drop the column `hqAddress` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `hqCity` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `hqCountry` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `hqZipCode` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `streetAddress` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `StudentProfile` table. All the data in the column will be lost.
  - Made the column `locationId` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `locationId` on table `Position` required. This step will fail if there are existing NULL values in that column.
  - Made the column `locationId` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_locationId_fkey";

-- DropForeignKey
ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_locationId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "hqAddress",
DROP COLUMN "hqCity",
DROP COLUMN "hqCountry",
DROP COLUMN "hqZipCode",
ALTER COLUMN "locationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "studentProfileId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "zipCode",
ALTER COLUMN "locationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "streetAddress",
DROP COLUMN "zipCode",
ALTER COLUMN "locationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
