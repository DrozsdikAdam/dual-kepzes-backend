/*
  Warnings:

  - You are about to drop the column `userId` on the `Location` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_userId_fkey";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "userId";
