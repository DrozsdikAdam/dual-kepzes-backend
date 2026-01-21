-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "error" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
