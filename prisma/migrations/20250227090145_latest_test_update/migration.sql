/*
  Warnings:

  - You are about to drop the column `CONSECUTIVE_BORROW_LIMIT_DATE` on the `Variables` table. All the data in the column will be lost.
  - Added the required column `CONSECUTIVE_BORROW_LIMIT_DAYS` to the `Variables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variables" DROP COLUMN "CONSECUTIVE_BORROW_LIMIT_DATE",
ADD COLUMN     "CONSECUTIVE_BORROW_LIMIT_DAYS" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Category";
