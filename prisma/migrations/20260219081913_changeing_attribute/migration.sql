/*
  Warnings:

  - Made the column `highSchoolLocation` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StudentProfile" ALTER COLUMN "highSchoolLocation" SET NOT NULL;
