/*
  Warnings:

  - You are about to drop the column `expiredDate` on the `BorrowedBook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BorrowedBook" DROP COLUMN "expiredDate",
ADD COLUMN     "expiryDate" TIMESTAMP(3);
