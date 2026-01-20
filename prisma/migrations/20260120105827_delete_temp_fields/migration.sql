/*
  Warnings:

  - You are about to drop the column `tempAddress` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempCity` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempZipCode` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tempAddress` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tempCity` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tempZipCode` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "tempAddress",
DROP COLUMN "tempCity",
DROP COLUMN "tempZipCode";

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "tempAddress",
DROP COLUMN "tempCity",
DROP COLUMN "tempZipCode";
