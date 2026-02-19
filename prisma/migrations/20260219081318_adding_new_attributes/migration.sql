-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "highSchoolLocation" TEXT,
ADD COLUMN     "motivationLetter" TEXT;
