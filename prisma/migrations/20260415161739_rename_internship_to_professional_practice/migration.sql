/*
  Warnings:

  - The values [INTERNSHIP] on the enum `PositionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PositionType_new" AS ENUM ('DUAL', 'PROFESSIONAL_PRACTICE', 'REGULAR_WORK');
ALTER TABLE "Position" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Position" ALTER COLUMN "type" TYPE "PositionType_new" USING ("type"::text::"PositionType_new");
ALTER TYPE "PositionType" RENAME TO "PositionType_old";
ALTER TYPE "PositionType_new" RENAME TO "PositionType";
DROP TYPE "PositionType_old";
ALTER TABLE "Position" ALTER COLUMN "type" SET DEFAULT 'DUAL';
COMMIT;
