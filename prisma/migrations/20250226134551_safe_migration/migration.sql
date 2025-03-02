/*
  Warnings:

  - You are about to drop the column `MAX_BOOK_LIMIT` on the `Variables` table. All the data in the column will be lost.
  - Added the required column `MAX_BORROW_LIMIT` to the `Variables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variables" DROP COLUMN "MAX_BOOK_LIMIT",
ADD COLUMN     "MAX_BORROW_LIMIT" INTEGER NOT NULL;
