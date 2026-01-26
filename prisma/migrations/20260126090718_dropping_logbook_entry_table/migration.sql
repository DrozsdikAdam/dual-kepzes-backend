/*
  Warnings:

  - You are about to drop the `LogbookEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LogbookEntry" DROP CONSTRAINT "LogbookEntry_partnershipId_fkey";

-- DropTable
DROP TABLE "LogbookEntry";
