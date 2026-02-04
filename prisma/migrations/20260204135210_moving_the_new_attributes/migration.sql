/*
  Warnings:

  - You are about to drop the column `firstChoice` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailableForWork` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isInHighSchool` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `languageLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `secondChoice` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "firstChoice" TEXT,
ADD COLUMN     "isAvailableForWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInHighSchool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "languageLevel" TEXT,
ADD COLUMN     "secondChoice" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstChoice",
DROP COLUMN "isAvailableForWork",
DROP COLUMN "isInHighSchool",
DROP COLUMN "language",
DROP COLUMN "languageLevel",
DROP COLUMN "secondChoice";
