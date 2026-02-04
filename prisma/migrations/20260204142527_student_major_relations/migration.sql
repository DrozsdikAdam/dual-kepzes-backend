/*
  Warnings:

  - You are about to drop the column `firstChoice` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `secondChoice` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "firstChoice",
DROP COLUMN "secondChoice",
ADD COLUMN     "firstChoiceId" TEXT,
ADD COLUMN     "majorId" TEXT,
ADD COLUMN     "secondChoiceId" TEXT;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_firstChoiceId_fkey" FOREIGN KEY ("firstChoiceId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_secondChoiceId_fkey" FOREIGN KEY ("secondChoiceId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE;
