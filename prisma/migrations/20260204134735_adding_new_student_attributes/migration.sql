-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstChoice" TEXT,
ADD COLUMN     "isAvailableForWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInHighSchool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "languageLevel" TEXT,
ADD COLUMN     "secondChoice" TEXT;
