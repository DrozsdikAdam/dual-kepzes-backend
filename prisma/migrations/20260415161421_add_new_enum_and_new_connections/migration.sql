/*
  Warnings:

  - You are about to drop the column `isDual` on the `Position` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('DUAL', 'INTERNSHIP', 'REGULAR_WORK');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "externalApplicationUrl" TEXT;

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "isDual",
ADD COLUMN     "type" "PositionType" NOT NULL DEFAULT 'DUAL';

-- CreateTable
CREATE TABLE "_MajorToUniversityUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CompanyToUniversityUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MajorToUniversityUser_AB_unique" ON "_MajorToUniversityUser"("A", "B");

-- CreateIndex
CREATE INDEX "_MajorToUniversityUser_B_index" ON "_MajorToUniversityUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyToUniversityUser_AB_unique" ON "_CompanyToUniversityUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyToUniversityUser_B_index" ON "_CompanyToUniversityUser"("B");

-- AddForeignKey
ALTER TABLE "_MajorToUniversityUser" ADD CONSTRAINT "_MajorToUniversityUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MajorToUniversityUser" ADD CONSTRAINT "_MajorToUniversityUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToUniversityUser" ADD CONSTRAINT "_CompanyToUniversityUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToUniversityUser" ADD CONSTRAINT "_CompanyToUniversityUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
