-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "majorId" TEXT;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE SET NULL ON UPDATE CASCADE;
