-- AlterTable
ALTER TABLE "DualPartnership" ADD COLUMN     "positionId" TEXT;

-- AddForeignKey
ALTER TABLE "DualPartnership" ADD CONSTRAINT "DualPartnership_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
